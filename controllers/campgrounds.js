const Campground = require('../models/campground.js');
const ObjectID = require('mongodb').ObjectID;
const { cloudinary } = require('../cloudinary/index.js');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKENS;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new.ejs')
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    })
        .send()
    if (!req.body.campground) {
        throw new ExpressError('Invalid Campground Data', 400);
    }
    const newCampground = new Campground(req.body.campground);
    newCampground.geometry = geoData.body.features[0].geometry;
    newCampground.author = req.user._id;
    newCampground.img = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await newCampground.save();
    console.log(newCampground);
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${newCampground._id}`)
}

module.exports.showCampground = async (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
        req.session.returnTo = req.session.previousReturnTo;
        console.log('Invalid campground show id, returnTo reset to:', req.session.returnTo);
    }
    const foundCampsById = await Campground.findById(req.params.id)
        .populate({
            path: 'review',
            populate: 'author'
        }).populate('author');
    console.log(foundCampsById);
    if (!foundCampsById) {
        req.flash('error', "This campground doesn't exist anymore, maybe got deleted.");
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show.ejs', { foundCampsById })
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const foundCampsById = await Campground.findById(id);
    console.log(foundCampsById);
    if (!foundCampsById) {
        req.flash('error', "This campground doesn't exist anymore, maybe got deleted.");
        return res.redirect('/campgrounds');
    }
    req.flash('success', 'Successfully edited the campground');
    res.render('campgrounds/edit.ejs', { foundCampsById })
}

module.exports.upadateCampground = async (req, res) => {
    const { id } = req.params;
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    })
        .send()
    const foundCampsById = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    foundCampsById.geometry = geoData.body.features[0].geometry;
    await foundCampsById.save();
    if (req.files.length > 0) {
        const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
        //[{url: f.url, f.filename}]
        //...spread operator => 解開array的[]
        foundCampsById.img.push(...imgs);
        await foundCampsById.save();
    }
    //刪除DB中該圖片的資料
    if (req.body.deletedImages) {
        for (let filename of req.body.deletedImages) {
            await cloudinary.uploader.destroy(filename);
            console.log(filename);
        }
        const deletedImages = await foundCampsById.updateOne({ $pull: { img: { filename: { $in: req.body.deletedImages } } } });
        console.log(`已從DB刪除:${deletedImages}`);
        console.log(foundCampsById);
    }
    req.flash('success', 'Successfully updated the campground');
    res.redirect(`/campgrounds/${foundCampsById._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const deletedCamp = await Campground.findByIdAndDelete(req.params.id);
    //刪掉Camp也刪掉Review中的資料 => Camp(parent), Review(Child)
    //findByIdAndDelete method觸發query-middleware =>findOneAndDelete
    for (let img of deletedCamp.img) {
        await cloudinary.uploader.destroy(img.filename);
    }
    req.flash('success', 'Successfully deleted the campground');
    res.redirect('/campgrounds');
}