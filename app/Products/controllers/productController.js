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
      const sizeArray = Array.isArray(size) ? size : size.split(','); // Kiểm tra nếu size là mảng hoặc chuỗi
      filterConditions.sizes = { $in: sizeArray }; // size là mảng, vì có thể chọn nhiều kích cỡ
    }

    if (price) {
      if (price === 'under100') filterConditions.price = { $lt: 100 };
      else if (price === '100to200') filterConditions.price = { $gte: 100, $lte: 200 };
      else if (price === '200to300') filterConditions.price = { $gte: 200, $lte: 300 };
      else if (price === 'over300') filterConditions.price = { $gt: 300 };
    }

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

    res.render('Shop/product-details', {title: 'product.name', product });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
