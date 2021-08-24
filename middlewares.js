const Campground = require('./models/campground.js');
const { reviewSchema } = require('./schema.js');
const ExpressError = require('./utils/ExpressError.js');
const Joi = require('joi');
const Review = require('./models/review.js');

module.exports.isLoggedIn = (req, res, next) => {
    //如果不是登入狀態就會執行
    //req.user => passport, 如果登入的話會在session存user的資訊
    if (!req.isAuthenticated()) {
        //store the url requested by users
        // req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must login in first');
        return res.redirect('/login');
    }
    //是登入狀態的話就會繼續執行接下來的middleware
    console.log(req.user);
    next();
};

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    //currentUser is olny send to ejs file.
    //no currentUser._id
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', "You can't do that!");
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    //currentUser is olny send to ejs file.
    //no currentUser._id
    if (!review.author.equals(req.user._id)) {
        req.flash('error', "You can't do that!");
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};

module.exports.validateCampground = (req, res, next) => {
    const campgroundSchema = Joi.object({
        campground: Joi.object({
            title: Joi.string().trim().required(),
            // img: Joi.string().trim().required(),
            price: Joi.number().min(0),
            description: Joi.string(),
            location: Joi.string().trim()
        }).required(),
        deletedImages: Joi.array()
    });
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

