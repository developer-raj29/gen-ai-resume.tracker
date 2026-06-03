const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,   // NOTE: unique is a boolean — custom duplicate messages should be
        required: [true, "Username is required"],   // handled via error code 11000 in controllers
        trim: true,
        minlength: [3, "Username must be at least 3 characters"],
        maxlength: [30, "Username cannot exceed 30 characters"]
    },

    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"]
    }
}, { timestamps: true })

const userModel = mongoose.model("users", userSchema)

module.exports = userModel