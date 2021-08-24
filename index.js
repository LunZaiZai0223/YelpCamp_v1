if (process.env.NODE_EVN !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const methodOverride = require('method-override');
const path = require('path');
const ExpressError = require('./utils/ExpressError.js');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");

const campgroundRoutes = require('./routes/campground.js');
const reviewRoutes = require('./routes/reviews.js');
const userRoutes = require('./routes/users.js');

const MongoDBStore = require('connect-mongo')(session);

const dbURL = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbURL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        userCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })

app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/lunzaizailunzaizai/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const store = new MongoDBStore({
    url: dbURL,
    secret: 'thisisatestingsecret',
    touchAfter: 24 * 60 * 60
});

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e);
});

const secret = process.env.SECRET || 'thisisatestingsecret';

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expire: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
        //expire + maxAge 以上兩個搭配可以在expire中顯示目前時間
    }
};
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//運用res.locals.variableName把flash當作local variable丟給各個template
app.use((req, res, next) => {
    console.log(req.query);
    //includes() => 檢查一陣列是否有相同的東西(true or false)
    //req.originalUrl => 發送請求時來自哪一個Url
    if (!['/login', '/register', '/'].includes(req.originalUrl)) {
        req.session.previousReturnTo = req.session.returnTo;
        req.session.returnTo = req.originalUrl;
        console.log('req.session.previousReturnTo', req.session.previousReturnTo)
        console.log('req.session.returnTo', req.session.returnTo);
    }
    res.locals.currentUser = req.user;
    //passport => 只要使用者登入後，就會有將user資料存在req.user => userSchema的格式，撇除密碼
    //把登入後才可以領取的資料放在local variable => 所有route都可以使用這個變數
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    //在route-campground => 什麼時候創造error
    //route-index => 丟到template
    next();
});


app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/review', reviewRoutes);


app.get('/', (req, res) => {
    res.render('campgrounds/homepage.ejs');
})

app.all('*', (req, res, next) => {
    req.session.returnTo = req.session.previousReturnTo;
    console.log('Previous returnTo reset to:', req.session.returnTo)
    next(new ExpressError('Page Not Found', 404))
})


//Error-handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) { err.message = 'Oh no! Someting wround!' }
    console.log(`Error-handling middleware: ${err.message}`);
    res.status(statusCode).render('alert/alert.ejs', { err });

})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`);
})