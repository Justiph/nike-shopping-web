const renderHomepage = (req, res) => {
  res.render('Homepage/homepage', { title: 'Home' });
};

module.exports = {
  renderHomepage,
};