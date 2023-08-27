const mongoose = require("mongoose");

//user schema
const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password: String,
    points:{type: Number, default: 0},
    tc: { type: Boolean, required: true },
    verified:{type: Boolean, default: false},
    expireAt: {
            type: Date,
            default: Date.now,
            expires: '300s'
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;