require("dotenv").config()
const http = require("http")
const app = require("./app")
const connectToDB = require("./config/database")

// ── Global Error Handlers ─────────────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Promise Rejection:", reason)
    server.close(() => process.exit(1))
})

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err)
    server.close(() => process.exit(1))
})

// ── Database ──────────────────────────────────────────────────────────────────
connectToDB()

// ── HTTP Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000

const server = http.createServer(app)

server.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`)
})

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`)
        process.exit(1)
    } else {
        console.error("Server error:", err)
        process.exit(1)
    }
})