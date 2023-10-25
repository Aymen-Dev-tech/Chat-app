import express from 'express'
import userModel from '../models/user.js'
import MongoStore from 'connect-mongo';

const router = express.Router()

const checkAuth = (req, res, next) => {
    if (req.user) return next()
    res.redirect('/login')
}

router.get('/messages', checkAuth, async (req, res) => {
    const users = await userModel.find({})
    const accounts = users.map(user => {
        const { _id, ...rest } = user;
        return rest;
    });
    try {
        res.render('chat', { accounts: accounts, username: req.user.name })
    } catch (error) {
        console.log("error on /messages endpoint: ", error)
        res.status(500).send(error);
    }

})

export default router 