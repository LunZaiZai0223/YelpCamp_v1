//要先require Mongoose
const mongoose = require('mongoose');

const Review = require('./review.js');

//建立骨架(Schema)
const Schema = mongoose.Schema;

//讓virtual可以在json的型態出現
const opts = { toJSON: { virtuals: true } };

const ImageSchema = new Schema({
    url: String,
    filename: String
});

// thumbnail(這個property)沒有存在DB中，只會為我們更改DB的中的網址
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_544,h_362');
});

const CampgroundSchema = new Schema({
    title: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    img: [ImageSchema],
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    review: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

//virtual不存在db中，但可以在db中拿資料
//用一般的function declaration，確保this不會跑掉(要指向每個campground的instance)
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `<strong><a href="campgrounds/${this._id}">${this.title}</a></strong>
            <p>${this.description.substring(0, 100)}</p>`
});


CampgroundSchema.post('findOneAndDelete', async function (deletedCamp) {
    if (deletedCamp) {
        const campReview = deletedCamp.review;
        await Review.deleteMany({ _id: { $in: campReview } });
        //$in => _id: 所有相同的id 都會被找出來
    }
});

//post => 執行findByIdAndDelete完後再執行query-middleware(findOneAndDelete)
//因為發生了，所以可以取得被刪掉的資料
//如果有camp被刪除的話，從被刪掉的camp中找出review(取得reference)的id
//從Review(collection)找到有相同id並刪除


module.exports = mongoose.model('Campground', CampgroundSchema);

