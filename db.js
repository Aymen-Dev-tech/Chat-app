import mongoose from 'mongoose';
import User from './models/user.js';
//mongodb connection 
mongoose.connect(process.env.URI)
const db = mongoose.connection
db.on('error', err => {
    console.error('MongoDB error: ' + err.message)
    process.exit(1)
})

db.once('open', () => console.log('MongoDB connection established'))

const getUserById = async (id) => User.findById(id);
const getUserByAuthId = async (authId) => User.findOne({ authId });
const addUser = async (data) => new User(data).save();

export { getUserById, getUserByAuthId, addUser, db };