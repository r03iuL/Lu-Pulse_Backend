const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authService = {
  /**
   * Validate login request
   * @param {string} email - User's email
   * @param {boolean} emailVerified - Email verification status from client
   * @returns {Promise<Object>} User document if valid
   * @throws {Error} If user not found or email not verified
   */
  verifyLogin: async (email, emailVerified) => {
    // Check if user exists
    const user = await User.findOneByEmail(email);
    if (!user) {
      throw new Error("User not found: The provided email does not match any account.");
    }

    // Check if client says email is verified
    if (!emailVerified) {
      throw new Error("Email not verified: Please verify your email before logging in.");
    }

    // Note: In the original code, they did not check if the user's emailVerified in the database is true.
    // We are maintaining the same behavior.

    return user;
  },

  /**
   * Generate JWT token for a user
   * @param {Object} user - User document from database
   * @returns {string} JWT token
   */
  generateToken: (user) => {
    return jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        adminRole: user.adminRole,
        department: user.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  },
};

module.exports = authService;