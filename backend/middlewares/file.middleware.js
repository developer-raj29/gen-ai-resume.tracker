const multer = require("multer")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, cb) => {
        // Only allow PDF files
        if (file.mimetype === "application/pdf") {
            cb(null, true)
        } else {
            cb(new Error("Only PDF files are allowed"), false)
        }
    }
})

module.exports = upload