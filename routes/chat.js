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
    const accounts = users.filter(user => user.name != req.user.name);
    try {
        res.render('chat', { accounts: accounts, 
                             username: req.user.name, 
                             picture: req.user.picture, 
                             firstUserName: accounts[0].name,
                             firstUserPicture: accounts[0].picture })
    } catch (error) {
        console.log("error on /messages endpoint: ", error)
        res.status(500).send(error);
    }

})

export default router 