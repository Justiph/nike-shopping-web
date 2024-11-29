const renderAbout = (req, res) => {
    res.render('About/about', { title: 'About' });
  };
  
  module.exports = {
    renderAbout,
  };