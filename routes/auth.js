import express from 'express'
import passport from 'passport';
import FacebookStrategy from 'passport-facebook'
import GoogleStrategy from 'passport-google-oauth20'
import * as db from '../db.js';
const router = express.Router();


passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
    db.getUserById(id)
        .then(user => done(null, user))
        .catch(err => done(err, null))
})


// configure & register Facebook strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: '/oauth2/redirect/facebook',
    state: true,
    profileFields: ['id', 'displayName', 'photos', 'email']
}, (accessToken, refreshToken, profile, done) => {
    const authId = 'facebook:' + profile.id
    db.getUserByAuthId(authId)
        .then(user => {
            if (user) return done(null, user)
            db.addUser({
                authId: authId,
                name: profile.displayName,
                picture: profile.photos[0].value,
                created: new Date()
            })
                .then(user => done(null, user))
                .catch(err => done(err, null))
        })
        .catch(err => {
            console.log('whoops, there was an error: ', err.message)
            if (err) return done(err, null);
        })
}))

// configure Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/oauth2/redirect/google',
}, (token, tokenSecret, profile, done) => {
    const authId = 'google:' + profile.id
    db.getUserByAuthId(authId)
        .then(user => {
            if (user) return done(null, user)
            db.addUser({
                authId: authId,
                name: profile.displayName,
                picture: profile.photos[0].value,
                created: new Date(),

            })
                .then(user => done(null, user))
                .catch(err => done(err, null))
        })
        .catch(err => {
            console.log('whoops, there was an error: ', err.message)
            if (err) return done(err, null);
        })
}))
router.get('/login', (req, res) => {
    if (req.user) res.redirect('/')
    const style = `
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="fonts/icomoon/style.css">

    <link rel="stylesheet" href="css/owl.carousel.min.css">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="css/bootstrap.min.css">

    <!-- Style -->
    <link rel="stylesheet" href="css/login.css">

    `
    res.render('login', { style: style })
})
//redircet the user to fb
router.get('/login/federated/facebook', passport.authenticate('facebook'));
router.get('/oauth2/redirect/facebook', passport.authenticate('facebook', {
    successRedirect: '/chat',
    failureRedirect: '/login'
}));

router.get('/login/federated/google', passport.authenticate('google'));
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

router.get('/oauth2/redirect/google',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/chat');
    });

export default router
