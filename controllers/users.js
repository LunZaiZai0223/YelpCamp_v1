const User = require('../models/user.js');

module.exports.renderRegisterForm = (req, res) => {
    res.render('../views/users/register.ejs');
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        console.log(email, username, password);
        const user = new User({ email, username });
        const neuUser = await User.register(user, password);
        req.login(neuUser, error => {
            if (error) {
                return next(error);
            } else {
                console.log(req.user);
                req.flash('success', 'Welcome to Yelp-Camp');
                res.redirect('/campgrounds');
            }
        })
    } catch (err) {
        req.flash('error', `${err.message}`);
        res.redirect('/register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('../views/users/login.ejs');
}

module.exports.login = (req, res) => {
    const redirectUrl = req.session.returnTo || '/campgrounds'
    req.flash('success', 'Welcome Back!');
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logOut();
    req.flash('success', 'Good Bye!');
    res.redirect('/campgrounds');
}