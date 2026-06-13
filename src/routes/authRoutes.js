const express = require("express");
const router = express.Router();
const { login, logout, signup } = require("../controllers/authController");

// API for User Authentication (Login) - Generates JWT Token
router.post("/login", login);

// API for User Authentication (Logout) - Clears JWT Token
router.post("/logout", logout);

// API for User Registration (Signup) - Creates new user in database
router.post("/signup", signup);

module.exports = router;
