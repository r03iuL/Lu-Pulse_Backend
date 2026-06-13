const express = require("express");
const router = express.Router();
const { login, logout } = require("../controllers/authController");

// API for User Authentication (Login) - Generates JWT Token
router.post("/login", login);

// API for User Authentication (Logout) - Clears JWT Token
router.post("/logout", logout);

module.exports = router;
