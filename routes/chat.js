import express from 'express'
import userModel from '../models/user.js'
import MongoStore from 'connect-mongo';

const router = express.Router()

const checkAuth = (req, res, next) => {
    if (req.user) return next()
    res.redirect('/login')
}

router.get('/chat', checkAuth, async (req, res) => {
    const users = await userModel.find({})
    const accounts = users.filter(user => user.name != req.user.name);
    const style = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/chat.css" rel="stylesheet">
    `
    try {
        res.render('chat', {
            accounts: accounts,
            username: req.user.name,
            picture: req.user.picture,
            firstUserName: accounts[0].name,
            firstUserPicture: accounts[0].picture,
            style: style,
        })
    } catch (error) {
        console.log("error on /messages endpoint: ", error)
        res.status(403).send(error);
    }

})

export default router 