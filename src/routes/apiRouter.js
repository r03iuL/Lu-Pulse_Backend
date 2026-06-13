const express = require("express");
const router = express.Router();
require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

async function checkDbStatus() {
  try {
    await client.connect();
    await client.db("LuPulse").command({ ping: 1 });
    return { status: "connected", type: "MongoDB", database: "LuPulse" };
  } catch (error) {
    return { status: "disconnected", type: "MongoDB", database: "LuPulse" };
  }
}

router.get("/", async (req, res) => {
  const dbStatus = await checkDbStatus();
  res.json({
    service: "LuPulse API",
    tagline: "Your campus pulse - events, notices & community",
    version: "1.0.0",
    status: "operational",
    uptime: formatUptime(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: dbStatus,
    endpoints: {
      auth: ["/login", "/logout", "/signup"],
      users: ["/users", "/users/:email", "/users/:email/role"],
      notices: ["/notices", "/notices/:id"],
      events: ["/events", "/events/:id"],
      media: ["/upload-image"]
    },
    repository: "https://github.com/r03iuL/Lu-Pulse_Backend"
  });
});

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
