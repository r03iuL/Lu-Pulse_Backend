const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserByEmail,
  updateUserProfile,
  updateUserRoleToAdmin,
  demoteAdminToUser,
  deleteUser,
} = require("../controllers/userController");
const { verifyToken, verifyAdmin, verifySuperAdmin } = require("../middlewares/authMiddleware");

// API to Fetch All Users
router.get("/", getAllUsers);

// API to Fetch a Specific User by Email
router.get("/:email", verifyToken, getUserByEmail);

// API to Update User Profile
router.patch("/:email", verifyToken, updateUserProfile);

// API to Update User Role to Admin
router.patch(
  "/:email/role",
  verifyToken,
  verifySuperAdmin,
  updateUserRoleToAdmin
);

// API to Demote an Admin to Regular User
router.patch(
  "/:email/demote",
  verifyToken,
  verifySuperAdmin,
  demoteAdminToUser
);

// API to Delete User
router.delete("/:email", verifyToken, verifyAdmin, deleteUser);

module.exports = router;
