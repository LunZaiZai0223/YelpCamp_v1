if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');

const Campground = require('../models/campground.js');
const Review = require('../models/review.js');
const cities = require('./cities.js');
const { descriptors, places, filename, url } = require('./seedHelpers.js');
const { cloudinary } = require('../cloudinary/index.js');

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKENS;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const dbURL = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true, userCreateIndex: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })

const sample = arr => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    await Review.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const camp = new Campground({
            title: `${sample(descriptors)} ${sample(places)}`,
            price: Math.floor(Math.random() * 20) + 10,
            img: [
                {
                    url: url[i],
                    filename: filename[i]
                }
            ],
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            author: '611a284652ed1b2bc13bd1f1',
            geometry: {
                type: 'Point',
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            description: `Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ab quaerat quis nihil iste consectetur ratione corrupti dolores vitae repellat error voluptate fugit qui magnam, eum officia ducimus voluptatibus eius ipsam?
            Reiciendis odio voluptas adipisci nihil ab commodi quam dolore illum? Error eaque maiores qui voluptatibus fugit ab expedita facere perferendis placeat, ipsam non consectetur veniam adipisci a eius reiciendis eveniet!`
        });
        await camp.save()
    }
}

seedDB()
    .then(() => {
        mongoose.connection.close();
        //斷開與DB的連結
    })
