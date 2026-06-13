const express = require("express");
const router = express.Router();
const {
  getNotices,
  createNotice,
  getNoticeById,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

// GET all notices - requires token for filtering
router.get("/", verifyToken, getNotices);

// POST create new notice - requires token and admin
router.post("/", verifyToken, verifyAdmin, createNotice);

// GET notice by ID - requires token
router.get("/:id", verifyToken, getNoticeById);

// PUT update notice - requires token and admin
router.put("/:id", verifyToken, verifyAdmin, updateNotice);

// DELETE notice - requires token and admin
router.delete("/:id", verifyToken, verifyAdmin, deleteNotice);

module.exports = router;
