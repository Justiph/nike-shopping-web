const Product = require('../models/productModel');
const { findRelatedProducts } = require('../services/relatedProductService');

exports.getShoppingPage = async (req, res) => {
  try {
    const { searchQuery, gender, size, category, price, page = 1, sort } = req.query;
    const ITEMS_PER_PAGE = 8;

    let filterConditions = {};

    if (searchQuery) {
      filterConditions.name = { $regex: searchQuery, $options: 'i' };
    }

    if (gender) {
      const genderArray = Array.isArray(gender) ? gender : gender.split(',');
      filterConditions.gender = { $in: genderArray };
    }

    if (size) {
      const sizeArray = Array.isArray(size) ? size : size.split(',');
      filterConditions.sizes = { $in: sizeArray };
    }

    if (category) {
      const categoryArray = Array.isArray(category) ? category : category.split(',');
      filterConditions.category = { $in: categoryArray };
    }

    //console.log('Price Query:', price);
    if (price) {
      const priceArray = Array.isArray(price) ? price : price.split(',');

      // Initialize an empty array to store price conditions
      const priceConditions = [];

      // Iterate through each price range and push the corresponding filter condition
      priceArray.forEach((range) => {
        if (range === 'under100') priceConditions.push({ price: { $lt: 100 } });
        else if (range === '100to200') priceConditions.push({ price: { $gte: 100, $lte: 200 } });
        else if (range === '200to300') priceConditions.push({ price: { $gte: 200, $lte: 300 } });
        else if (range === 'over300') priceConditions.push({ price: { $gt: 300 } });
      });


      if (priceConditions.length > 0) {
        filterConditions.$or = priceConditions;
      }
    }

    // Determine sort order
    let sortConditions = {};
    if (sort) {
      if (sort === 'newest') {
        sortConditions = { createdAt: -1 }; // Sort by newest products
      } else if (sort === 'increasing_price') {
        sortConditions = { price: 1 }; // Sort by price (low to high)
      } else if (sort === 'decreasing_price') {
        sortConditions = { price: -1 }; // Sort by price (high to low)
      }
      // } else if (sort === 'reviews') {
      //   sortConditions = { reviewsCount: -1 }; // Sort by number of reviews (assuming a `reviewsCount` field exists)
      // }
    }

    //console.log('Filter Conditions:', filterConditions);
    const totalItems = await Product.countDocuments(filterConditions);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const filteredData = await Product.find(filterConditions)
      .sort(sortConditions)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    //console.log('Data:', filteredData);

    if (req.xhr) {
      // Respond with JSON for AJAX requests
      return res.json({
        products: filteredData,
        totalPages,
        currentPage: Number(page),
      });
    }

    const men = '/assets/men.png';
    const women = '/assets/women.png';
    const kid = '/assets/kids.png';

    res.render('Shop/main-shopping', {
      title: 'Shop',
      filteredData,
      totalPages,
      currentPage: Number(page),
      men,
      women,
      kid,
      searchQuery: searchQuery || '',
      gender,
      size,
      category,
      price,
      sort,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching products');
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Fetch all products for similarity calculation
    const allProducts = await Product.find({});
    // Find related products
    const relatedProductIds = findRelatedProducts(allProducts, productId);
    // Get detailed info of related products
    const relatedProducts = await Product.find({
      _id: { $in: relatedProductIds.map((item) => item.productId) },
    });

    res.render('Shop/product-details', { title: `${product.name}`, product, relatedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
