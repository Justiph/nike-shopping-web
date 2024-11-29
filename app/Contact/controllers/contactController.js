const contactController = {
    // Render the contact form
    renderContactForm: (req, res) => {
      res.render('Contact/contact', { formData: {}, title: 'Contact' }); // Render the form with empty initial data
    },
  
    // Handle form submission
    handleFormSubmission: (req, res) => {
      const { name, email, message } = req.body;
      console.log('Form submitted:', { name, email, message });
      // Implement logic to handle the form data, e.g., saving to a database or sending an email
      res.redirect('/contact'); // Redirect back to the contact form after submission
    },
  };
  
  module.exports = contactController;
  