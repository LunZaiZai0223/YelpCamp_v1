const express = require('express');
const router = express.Router();
const passport = require('passport');

const catchAsync = require('../utils/catchAsync.js');

const users = require('../controllers/users.js');

router.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login);

router.route('/register')
    .get(users.renderRegisterForm)
    //舊：register沒有辦法註冊完就立即保持登入狀態 => session無該user資訊
    .post(catchAsync(users.register));

//設定登出的route
router.get('/logout', users.logout);

module.exports = router;