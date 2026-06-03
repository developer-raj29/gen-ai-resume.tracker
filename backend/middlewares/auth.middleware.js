const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function authUser(req, res, next) {
    try {
        // Support both cookie-based and Bearer token auth
        const token = req.cookies.token ||
            (req.headers.authorization?.startsWith("Bearer ") &&
                req.headers.authorization.split(" ")[1])

        if (!token) {
            return res.status(401).json({
                message: "Token not provided. Please login."
            })
        }

        // Check if token has been blacklisted (user logged out)
        const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token })

        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "Session expired. Please login again."
            })
        }

        // Verify the JWT signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired. Please login again." })
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token. Please login again." })
        }
        // DB or unexpected error
        console.error("authUser middleware error:", err)
        return res.status(500).json({ message: "Internal server error during authentication." })
    }
}

module.exports = { authUser }