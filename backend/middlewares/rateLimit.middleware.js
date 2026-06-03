const rateLimit = require("express-rate-limit")

/**
 * @description Rate limiter for auth endpoints (login, register)
 * Limits each IP to 10 requests per 15 minutes to prevent brute-force attacks
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,                    // max 10 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again after 15 minutes." }
})

module.exports = { authLimiter }
