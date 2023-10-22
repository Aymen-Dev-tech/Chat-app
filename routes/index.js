import express from 'express' 

const router = express.Router();



router.get('/', (req, res) => {
    res.render('landing', { username: req.user && req.user.name })
})


export default router
