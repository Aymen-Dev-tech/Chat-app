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
import InMemoryMessageStore from "./messageStore.js"


//init express 
const app = express()
//inint http server
const server = createServer(app)
// init socket server
const io = new Server(server)
const port = process.env.PORT || 3000
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
app.engine('handlebars', expressHandlebars.engine())
app.set('view engine', 'handlebars')
// setup the public directory 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')))
const randomId = () => crypto.randomBytes(8).toString("hex");

const sessionStore = new InMemorySessionStore();
const messageStore = new InMemoryMessageStore();
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
    console.log('about to generate new session ID !');
    socket.sessionID = randomId();
    socket.userID = randomId();
    socket.username = username;
    console.log('session id generattion completed !');
    next();
});

io.on("connection", (socket) => {
    // persist session
    console.log('inside connection event: saving session on the memory')
    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true,
        messages: [],
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
    const messagesPerUser = new Map();
    messageStore.findMessagesForUser(socket.userID).forEach((message) => {
        console.log("the content of the message obj: ", message);
        const { from, to } = message;
        const otherUser = socket.userID === from ? to : from;
        if (messagesPerUser.has(otherUser)) {
            messagesPerUser.get(otherUser).push(message);
        } else {
            messagesPerUser.set(otherUser, [message]);
        }
    });

    sessionStore.findAllSessions().forEach((session) => {
        users.push({
            userID: session.userID,
            username: session.username,
            connected: session.connected,
            messages: messagesPerUser.get(session.userID) || [],
        });

    });
    console.log("<SERVER> sending all connected users along with there messages: ", users)
    socket.emit("users", users);

    // notify existing users
    console.log("<SERVER> a new user connected notify others: ", {
        userID: socket.userID,
        username: socket.username,
        connected: true,
    })
    socket.broadcast.emit("user connected", {
        userID: socket.userID,
        username: socket.username,
        connected: true,
        messages: []
    });
    // forward the private message to the right recipient
    socket.on("private message", ({ content, senderDetails, to, time }) => {
        console.log(`sending ${content} to ${to}`);
        const message = {
            content,
            senderDetails,
            from: socket.userID,
            to,
            time
        }
        socket.to(to).to(socket.userID).emit("private message", message);
        console.log('<SERVER> adding new message to messages store: ', message);
        messageStore.saveMessage(message)
    });
    socket.on('switching_account', (accounts) =>{
        console.log("<SERVER> i have bean notified about the swithing")
        socket.emit("update_messages", users)
    })

    // notify users upon disconnection
    socket.on("disconnect", async () => {
        console.log("user disconnected")
        const matchingSockets = await io.in(socket.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
            // notify other users
            socket.broadcast.emit("user disconnected", socket.userID);
            console.log("user disconnected", socket.userID)
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
        
// Assuming you have a trigger to signal server shutdown

process.on('SIGINT', () => {
    console.log('Server is about to disconnect');

    // Notify all connected clients about the server shutdown
    io.emit('server_about_to_disconnect', { message: 'Server is about to disconnect' });

    // Close the server
    server.close(() => {
        console.log('Server disconnected');
        process.exit(0);
    });
});