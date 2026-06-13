const User = require("../models/User");

const userService = {
  /**
   * Register a new user
   * @param {Object} signupData - Contains fullName, id, email, userType, department, image, designation
   * @returns {Promise<Object>} The created user document
   * @throws {Error} If validation fails or email already exists
   */
  registerUser: async (signupData) => {
    const {
      fullName,
      id,
      email,
      userType,
      department,
      image,
      designation,
    } = signupData;

    // Validate required fields
    if (!fullName || !id || !email || !userType || !department) {
      throw new Error("Validation Error: All required fields must be provided.");
    }

    // Check if user already exists
    const existingUser = await User.findOneByEmail(email);
    if (existingUser) {
      throw new Error("Account already exists: The provided email is already registered.");
    }

    // Prepare user data
    const userData = {
      fullName,
      id,
      email,
      userType,
      department,
      image,
      designation,
      createdAt: new Date(),
      adminRole: "user", // Default role is user
    };

    // Insert user
    await User.insertOne(userData);

    return userData;
  },

  /**
   * Update user profile
   * @param {string} email - Email of the user to update
   * @param {Object} updateData - Contains fullName, designation, image (optional)
   * @param {string} requesterEmail - Email of the authenticated user making the request
   * @param {string} requesterAdminRole - Admin role of the requester
   * @returns {Promise<Object>} The update result
   * @throws {Error} If validation fails or user not authorized
   */
  updateUserProfile: async (email, updateData, requesterEmail, requesterAdminRole) => {
    const { fullName, designation, image } = updateData;

    // Validate required fields
    if (!fullName || !designation) {
      throw new Error("Validation Error: Full Name and Designation are required.");
    }

    // Fetch the user to be updated
    const userToUpdate = await User.findOneByEmail(email);
    if (!userToUpdate) {
      throw new Error("User not found: The account associated with this email does not exist.");
    }

    // Authorization: user can update their own profile, or admin/superadmin can update any profile
    const isSelfUpdate = email === requesterEmail;
    const isAdminOrSuperAdmin =
      requesterAdminRole === "admin" || requesterAdminRole === "superadmin";

    if (!isSelfUpdate && !isAdminOrSuperAdmin) {
      throw new Error("Forbidden: You can only update your own profile.");
    }

    // Prepare update data
    const updatedUser = { fullName, designation };
    if (image) {
      updatedUser.image = image;
    }

    // Perform update
    const result = await User.updateOneByEmail(email, updatedUser);
    return result;
  },

  /**
   * Promote a user to admin role
   * @param {string} email - Email of the user to promote
   * @param {string} requesterEmail - Email of the authenticated user making the request
   * @param {string} requesterAdminRole - Admin role of the requester (must be superadmin)
   * @returns {Promise<Object>} The update result
   * @throws {Error} If user not authorized, user not found, or user is already admin/superadmin
   */
  promoteUserToAdmin: async (email, requesterEmail, requesterAdminRole) => {
    // Only superadmin can promote
    if (requesterAdminRole !== "superadmin") {
      throw new Error("Forbidden: Only superadmins can promote users to admin.");
    }

    // Fetch the user to promote
    const userToPromote = await User.findOneByEmail(email);
    if (!userToPromote) {
      throw new Error("User not found: The account associated with this email does not exist.");
    }

    // Cannot promote if already admin or superadmin
    if (userToPromote.adminRole === "admin" || userToPromote.adminRole === "superadmin") {
      throw new Error("Validation Error: The user is already an Admin or SuperAdmin.");
    }

    // Perform promotion
    const result = await User.updateOneByEmail(email, { adminRole: "admin" });
    return result;
  },

  /**
   * Demote an admin to regular user
   * @param {string} email - Email of the admin to demote
   * @param {string} requesterEmail - Email of the authenticated user making the request
   * @param {string} requesterAdminRole - Admin role of the requester (must be superadmin)
   * @returns {Promise<Object>} The update result
   * @throws {Error} If user not authorized, user not found, or user is superadmin (cannot demote)
   */
  demoteAdminToUser: async (email, requesterEmail, requesterAdminRole) => {
    // Only superadmin can demote
    if (requesterAdminRole !== "superadmin") {
      throw new Error("Forbidden: Only superadmins can demote admins.");
    }

    // Fetch the admin to demote
    const adminToDemote = await User.findOneByEmail(email);
    if (!adminToDemote) {
      throw new Error("Admin not found: The requested account does not exist.");
    }

    // Cannot demote superadmin
    if (adminToDemote.adminRole === "superadmin") {
      throw new Error("Forbidden: Superadmins cannot be demoted.");
    }

    // Perform demotion
    const result = await User.updateOneByEmail(email, { adminRole: "user" });
    return result;
  },

  /**
   * Find a user by email
   * @param {string} email - Email of the user to find
   * @returns {Promise<Object|null>} The user document or null if not found
   */
  getUserByEmail: async (email) => {
    return await User.findOneByEmail(email);
  },

  /**
   * Get all users
   * @returns {Promise<Array>} Array of user documents
   */
  getAllUsers: async () => {
    return await User.findAll();
  },
};

module.exports = userService;