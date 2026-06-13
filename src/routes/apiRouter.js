const express = require("express");
const router = express.Router();

// Import feature routers
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const noticeRoutes = require("./noticeRoutes");
const eventRoutes = require("./eventRoutes");
const uploadRoutes = require("./uploadRoutes");

// Prefix and combine sub-routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/notices", noticeRoutes);
router.use("/events", eventRoutes);
router.use("/upload", uploadRoutes);

module.exports = router;
