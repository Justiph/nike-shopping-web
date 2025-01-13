const renderHomepage = (req, res) => {
  res.render('Homepage/homepage', { title: 'Home' });
};

const renderTermsConditions = (req, res) => {
  res.render('Homepage/terms-conditions', { title: 'Terms and Conditions' });
}

module.exports = {
  renderHomepage, renderTermsConditions,
};