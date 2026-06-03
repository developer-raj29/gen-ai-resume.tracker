const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to be added in blacklist"],
        index: true   // index for fast lookup on every auth request
    },
    // TTL index: MongoDB auto-deletes documents 1 day after createdAt
    // This matches our JWT expiry of "1d" so expired tokens are cleaned up automatically
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "1d"
    }
})

const tokenBlacklistModel = mongoose.model("blacklistTokens", blacklistTokenSchema)

module.exports = tokenBlacklistModel