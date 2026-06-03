const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

// ── Cookie Options ────────────────────────────────────────────────────────────
const cookieOptions = {
    httpOnly: true,                                                 // Prevents XSS from reading via document.cookie
    secure: process.env.NODE_ENV === "production",                  // HTTPS only in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",  // Cross-site in prod, lax in dev
    maxAge: 24 * 60 * 60 * 1000                                     // 1 day (matches JWT expiry)
}


/**
 * @name registerUserController
 * @description Register a new user, expects username, email and password in the request body
 * @access Public
 */
const registerUserController = async (req, res) => {
    try {
        const { username, email, password } = req.body

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        // Check for existing user before hashing (cheaper operation first)
        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hash
        })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, cookieOptions)

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        // Handle MongoDB duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0]
            return res.status(400).json({
                message: `An account with this ${field} already exists`
            })
        }
        console.error("registerUserController error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


/**
 * @name loginUserController
 * @description Login a user, expects email and password in the request body
 * @access Public
 */
const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password"
            })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, cookieOptions)

        res.status(200).json({
            message: "User logged in successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("loginUserController error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


/**
 * @name logoutUserController
 * @description Clear token from user cookie and add the token to the blacklist
 * @access Public
 */
const logoutUserController = async (req, res) => {
    try {
        const token = req.cookies.token

        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        res.clearCookie("token", cookieOptions)

        res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (err) {
        console.error("logoutUserController error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


/**
 * @name getMeController
 * @description Get the current logged-in user details
 * @access Private
 */
const getMeController = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password")

        // Guard: user may have been deleted since the JWT was issued
        if (!user) {
            return res.status(404).json({
                message: "User not found. Account may have been deleted."
            })
        }

        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("getMeController error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController }