const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync.js');
const { isLoggedIn, isAuthor, validateCampground } = require('../middlewares.js');

const campgrounds = require('../controllers/campgrounds.js');
const { storage } = require('../cloudinary/index.js');
//只要傳來的storage的storage物件的東東
const multer = require('multer')
const upload = multer({ storage })

router.route('/')
    //INDEX
    .get(catchAsync(campgrounds.index))
    //CREATE
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))

//NEW
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    //SHOW
    .get(catchAsync(campgrounds.showCampground))
    //UPDATE
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.upadateCampground))
    //DELETE
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

//EDIT
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

module.exports = router;