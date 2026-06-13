const User = require("../models/User");
const { connectToDatabase } = require("../config/db");

/**
 * Fetch all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to retrieve user data. Please try again later." });
  }
};

/**
 * Fetch a specific user by email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserByEmail = async (req, res) => {
  const { email } = req.params;
  const tokenEmail = req.user.email;
  const adminRole = req.user.adminRole;

  try {
    if (
      email !== tokenEmail &&
      adminRole !== "admin" &&
      adminRole !== "superadmin"
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only access your own account information." });
    }

    const user = await User.findOneByEmail(email);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found: The requested account does not exist." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to retrieve user data. Please try again later." });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserProfile = async (req, res) => {
  const { email } = req.params;
  const { fullName, designation, image } = req.body;

  try {
    if (
      email !== req.user.email &&
      req.user.adminRole !== "admin" &&
      req.user.adminRole !== "superadmin"
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own profile." });
    }

    if (!fullName || !designation) {
      return res
        .status(400)
        .json({ message: "Validation Error: Full Name and Designation are required." });
    }

    const updatedUser = { fullName, designation };

    if (image) {
      updatedUser.image = image;
    }

    const result = await User.updateOneByEmail(email, updatedUser);

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "No changes made: The user profile was not updated." });
    }

    res.status(200).json({
      message: "Profile updated successfully. Your changes have been saved.",
      user: { ...updatedUser, email },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to update your profile. Please try again later." });
  }
};

/**
 * Update user role to admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserRoleToAdmin = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOneByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found: The requested account does not exist." });
    }

    if (user.adminRole === "admin" || user.adminRole === "superadmin") {
      return res
        .status(400)
        .json({ message: "Validation Error: The user is already an Admin or SuperAdmin." });
    }

    const result = await User.updateOneByEmail(email, { adminRole: "admin" });

    if (result.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "Internal Server Error: Unable to update the user role." });
    }

    res
      .status(200)
      .json({ message: "User role updated successfully. The user is now an Admin." });
  } catch (error) {
    console.error("Error promoting user:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to update the user role. Please try again later." });
  }
};

/**
 * Demote an admin to regular user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const demoteAdminToUser = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOneByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Admin not found: The requested account does not exist." });
    }

    if (user.adminRole === "superadmin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Superadmins cannot be demoted." });
    }

    const result = await User.updateOneByEmail(email, { adminRole: "user" });

    if (result.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "Internal Server Error: Unable to demote the admin." });
    }

    res.status(200).json({ message: "Admin demoted successfully. The user is now a regular user." });
  } catch (error) {
    console.error("Error demoting admin:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to demote the admin. Please try again later." });
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOneByEmail(email);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found: The requested account does not exist." });
    }

    if (user.adminRole === "superadmin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Superadmins cannot be deleted." });
    }

    const result = await User.deleteOneByEmail(email);

    if (result.deletedCount === 0) {
      return res
        .status(500)
        .json({ message: "Internal Server Error: Unable to delete the user." });
    }

    res.status(200).json({ message: "User deleted successfully. The account has been removed." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to delete the user. Please try again later." });
  }
};

module.exports = {
  getAllUsers,
  getUserByEmail,
  updateUserProfile,
  updateUserRoleToAdmin,
  demoteAdminToUser,
  deleteUser
};
