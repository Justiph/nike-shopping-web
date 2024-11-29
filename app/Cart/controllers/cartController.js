const renderCart = (req, res) => {
    res.render('Cart/cart', { title: 'Your Cart' });
  };
  
  module.exports = {
    renderCart,
  };