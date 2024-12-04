const Product = require('../models/productModel');

exports.getShoppingPage = async (req, res) => {
  try {
    const { searchQuery, gender, size, category, price } = req.query;
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

    //console.log('Filter Conditions:', filterConditions);

    const filteredData = await Product.find(filterConditions);
    const men = '/assets/men.png';
    const women = '/assets/women.png';
    const kid = '/assets/kids.png';

    res.render('Shop/main-shopping', {
      title: 'Shop',
      filteredData,
      men,
      women,
      kid,
      searchQuery: searchQuery || '',
      gender,
      size,
      category,
      price
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

    res.render('Shop/product-details', {title: `${product.name}`, product });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
