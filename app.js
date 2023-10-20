import express from 'express'
import expressHandlebars from 'express-handlebars'
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'
import { db } from './db.js'
import session from 'express-session';
import MongoStore from 'connect-mongo';
import initializeRoutes from './routes/routes.js';



const app = express()
const port = process.env.PORT || 3000

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create(db),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
    }
}));
initializeRoutes(app);
// configure Handlebars view engine
app.engine('handlebars', expressHandlebars.engine({
    defaultLayout: 'main',
}))
app.set('view engine', 'handlebars')
// setup the public directory 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))












// custom 404 page
app.use((req, res) => {
    res.type('text/plain')
    res.status(404)
    res.send('404 - Not Found')
})
// custom 500 page
app.use((err, req, res, next) => {
    console.error(err.message)
    res.type('text/plain')
    res.status(500)
    res.send('500 - Server Error')
})
app.listen(port, () => console.log(
    `Express started on http://localhost:${port}; ` +
    `press Ctrl-C to terminate.`))