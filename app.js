import express from 'express'
import expressHandlebars from 'express-handlebars'
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'



const app = express()
const port = process.env.PORT || 3000


// configure Handlebars view engine
app.engine('handlebars', expressHandlebars.engine({
    defaultLayout: 'main',
}))
app.set('view engine', 'handlebars')
// setup the public directory 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.render('landing')
})

app.get('/login', (req, res) => {
    res.render('login')
})









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