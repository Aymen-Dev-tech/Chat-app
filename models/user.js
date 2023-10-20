import mongoose from "mongoose"; 

const userSchema = mongoose.Schema({
    authId: String, 
    name: String, 
    email: String,
    created: String 
})

const User = mongoose.model('User', userSchema)
export default User