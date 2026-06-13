const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const { uploadImage } = require("../controllers/uploadController");

// Configure multer with Cloudinary storage
const upload = multer({ storage: storage });

// API to Upload Image to Cloudinary
router.post("/upload-image", upload.single("image"), uploadImage);

module.exports = router;
