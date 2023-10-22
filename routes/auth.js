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
    console.log('user profile fb: ', profile);
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
    console.log('google profile: ', profile);
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
    if(req.user) res.redirect('/')
    res.render('login')
})
//redircet the user to fb
router.get('/login/federated/facebook', passport.authenticate('facebook'));
router.get('/oauth2/redirect/facebook', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.get('/login/federated/google', passport.authenticate('google'));
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

router.get('/oauth2/redirect/google',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

export default router
