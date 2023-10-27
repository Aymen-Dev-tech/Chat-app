import express from 'express'
import expressHandlebars from 'express-handlebars'
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'
import { db } from './db.js'
import session from 'express-session';
import MongoStore from 'connect-mongo';
import initializeRoutes from './routes/routes.js';
import passport from 'passport';
import { Server } from 'socket.io';
import { createServer } from 'http';
import crypto from 'crypto'
import InMemorySessionStore from "./sessionStore.js";

//init express 
const app = express()
//inint http server
const server = createServer(app)
// init socket server
const io = new Server(server)
const port = process.env.PORT || 3000
/* io.on("connection", (socket) => {
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
        });
    }
    socket.emit("users", users);
    // ...
}) */;


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create(db),
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
    }
}));
app.use(passport.session());
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
const randomId = () => crypto.randomBytes(8).toString("hex");

const sessionStore = new InMemorySessionStore();
io.use((socket, next) => {
    console.log('<SERVER> about to set session IDs')
    const sessionID = socket.handshake.auth.sessionID;
    console.log('Session id: ', sessionID)
    if (sessionID) {
        const session = sessionStore.findSession(sessionID);
        if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
            return next();
        }
    }
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.sessionID = randomId();
    socket.userID = randomId();
    socket.username = username;
    next();
});

io.on("connection", (socket) => {
    // persist session
    console.log('inside connection event')
    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true,
    });

    // emit session details
    socket.emit("session", {
        sessionID: socket.sessionID,
        userID: socket.userID,
    });

    // join the "userID" room
    socket.join(socket.userID);

    // fetch existing users
    const users = [];
    sessionStore.findAllSessions().forEach((session) => {
        users.push({
            userID: session.userID,
            username: session.username,
            connected: session.connected,
        });
        console.log("<SERVER> sending all connected users: ", users)
    });
    socket.emit("users", users);

    // notify existing users
    socket.broadcast.emit("user connected", {
        userID: socket.userID,
        username: socket.username,
        connected: true,
    });
    // forward the private message to the right recipient
    socket.on("private message", ({ content, senderDetails, to }) => {
        console.log(`sending ${content} to ${to}`);
        socket.to(to).to(socket.userID).emit("private message", {
            content,
            senderDetails,
            from: socket.userID,
            to,
        });
    });

    // notify users upon disconnection
    socket.on("disconnect", async () => {
        const matchingSockets = await io.in(socket.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
            // notify other users
            socket.broadcast.emit("user disconnected", socket.userID);
            // update the connection status of the session
            sessionStore.saveSession(socket.sessionID, {
                userID: socket.userID,
                username: socket.username,
                connected: false,
            });
        }
    });
});








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
server.listen(port, () => console.log(
    `Express started on http://localhost:${port}; ` +
    `press Ctrl-C to terminate.`))