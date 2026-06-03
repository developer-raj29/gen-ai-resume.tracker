const { Router } = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const { authLimiter } = require("../middlewares/rateLimit.middleware")

const authRouter = Router()


/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authLimiter, authController.registerUserController)


/**
 * @route POST /api/auth/login
 * @description Login user with email and password
 * @access Public
 */
authRouter.post("/login", authLimiter, authController.loginUserController)


/**
 * @route POST /api/auth/logout
 * @description Clear token from user cookie and add the token to the blacklist
 * @access Public
 */
authRouter.post("/logout", authController.logoutUserController)   // Changed GET → POST (state-changing operation)


/**
 * @route GET /api/auth/get-me
 * @description Get the current logged-in user details
 * @access Private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)


module.exports = authRouter