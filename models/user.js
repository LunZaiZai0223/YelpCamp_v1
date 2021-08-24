const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
        //unique => 告訴Mongoose每個email key都要unique = 不可重複
    }
});

UserSchema.plugin(passportLocalMongoose);

// handling the unique email error
UserSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000 && error.keyValue.email) {
        //console.log(error.name);
        //MongoError

        // console.log(error)
        //driver: true,
        //index: 0,
        //code: 11000,
        //keyPattern: { email: 1 },
        //keyValue: { email: 'lun@gmail.com' }
        next(new Error('Email address was already taken, please choose a different one'));
    } else {
        next(error);
    }
});

module.exports = mongoose.model('User', UserSchema);