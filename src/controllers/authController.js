const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("../config/db");
const User = require("../models/User");

/**
 * Login controller - Generates JWT Token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  const { uid, email, emailVerified } = req.body;

  try {
    const user = await User.findOneByEmail(email);

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "User not found: The provided email does not match any account.",
        });
    }

    if (!emailVerified) {
      return res
        .status(403)
        .json({
          message:
            "Email not verified: Please verify your email before logging in.",
        });
    }

    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        adminRole: user.adminRole,
        department: user.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res
      .status(200)
      .json({ message: "Login successful. Welcome back!", success: true });
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({
        message:
          "Internal Server Error: Unable to process your login request. Please try again later.",
      });
  }
};

/**
 * Logout controller - Clears JWT Token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 0,
  });
  res
    .status(200)
    .json({ message: "Logout successful. You have been signed out." });
};

module.exports = { login, logout };
