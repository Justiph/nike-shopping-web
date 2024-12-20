module.exports = (req, res, next) => {
    // console.log('ensureAuth middleware called');
    // console.log('req.xhr:', req.xhr);
    // console.log('req.headers.accept:', req.headers.accept);
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
