module.exports = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            //console.log('Unauthorized. Please log in.');
            // For AJAX requests, return 401
            return res.status(401).json({ message: 'Unauthorized. Please log in.'});
        } else {
            res.redirect('/auth/login');
        }
    }
};
