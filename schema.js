const { sanitize } = require('express-mongo-sanitize');
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

const validateCampground = (req, res, next) => {
    const campgroundSchema = Joi.object({
        campground: Joi.object({
            titile: Joi.string().trim().required().escapeHTML(),
            img: Joi.string().trim().required().escapeHTML(),
            price: Joi.number().min(0),
            description: Joi.string().required().escapeHTML(),
            location: Joi.string().trim().required().escapeHTML()
        }).required()
    });
    const { error } = campgroundSchema.validate(req.body);
    //可以直接看到error中其他的property
    console.log(error.details);
    console.log(error.details.map(el => el.message).join(','));
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number(),
        body: Joi.string().required().escapeHTML()
    }).required()
})