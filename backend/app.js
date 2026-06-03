const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const mongoSanitize = require("express-mongo-sanitize")

const app = express()

// ── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = ["http://localhost:5173"]
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL)
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}))

// ── Body Parsing (with size limit to prevent DoS) ────────────────────────────
app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true, limit: "10kb" }))
app.use(cookieParser())

// ── NoSQL Injection Prevention ────────────────────────────────────────────────
app.use(mongoSanitize())

// ── Routes ────────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ message: `Gen-AI Interview Server Running on PORT : ${process.env.PORT || 3000}` })
})

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack)

    // Handle Multer errors
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum allowed size is 3MB." })
    }
    if (err.message === "Only PDF files are allowed") {
        return res.status(400).json({ message: err.message })
    }

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    })
})

module.exports = app