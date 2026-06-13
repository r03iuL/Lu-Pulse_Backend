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
      return res.status(404).json({
        message:
          "User not found: The provided email does not match any account.",
      });
    }

    if (!emailVerified) {
      return res.status(403).json({
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

    // Also send the token in the response body so the frontend can store it
    // in localStorage and use it as a Bearer token for cross-origin requests
    // (browsers increasingly block third-party cookies across different domains).
    res.status(200).json({
      message: "Login successful. Welcome back!",
      success: true,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
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

/**
 * Signup controller - Registers a new user in the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signup = async (req, res) => {
  try {
    const { fullName, id, email, userType, designation, department, image } =
      req.body;

    if (!fullName || !id || !email || !userType || !department) {
      return res
        .status(400)
        .json({
          message: "Validation Error: All required fields must be provided.",
        });
    }

    const existingUser = await User.findOneByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({
          message:
            "Account already exists: The provided email is already registered.",
        });
    }

    const userData = {
      fullName,
      id,
      email,
      userType,
      department,
      image,
      designation,
      createdAt: new Date(),
      adminRole: "user",
    };

    await User.insertOne(userData);
    res
      .status(201)
      .json({
        message: "Registration successful. Welcome to LuPulse!",
        user: userData,
      });
  } catch (error) {
    console.error("Signup Error:", error);
    res
      .status(500)
      .json({
        message:
          "Internal Server Error: Unable to complete your registration. Please try again later.",
      });
  }
};

module.exports = { login, logout, signup };
