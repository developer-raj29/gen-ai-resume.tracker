const mongoose = require("mongoose")

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
        })
        console.log("Connected to Database ✅")
    }
    catch (err) {
        console.error("Database Connection Failed ❌", err.message)
        process.exit(1)
    }
}

// Gracefully close the DB connection on app termination
process.on("SIGINT", async () => {
    await mongoose.connection.close()
    console.log("MongoDB connection closed gracefully.")
    process.exit(0)
})

process.on("SIGTERM", async () => {
    await mongoose.connection.close()
    console.log("MongoDB connection closed gracefully.")
    process.exit(0)
})

module.exports = connectToDB
