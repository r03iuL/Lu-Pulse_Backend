const express = require("express");
const router = express.Router();
const {
  getAllEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

// GET all events - public access
router.get("/", getAllEvents);

// POST create new event - requires token and admin
router.post("/", verifyToken, verifyAdmin, createEvent);

// GET event by ID - public access
router.get("/:id", getEventById);

// PUT update event - requires token and admin
router.put("/:id", verifyToken, verifyAdmin, updateEvent);

// DELETE event - requires token and admin
router.delete("/:id", verifyToken, verifyAdmin, deleteEvent);

module.exports = router;
