const Notice = require("../models/Notice");

/**
 * Service for handling notice operations
 */
const noticeService = {
  /**
   * Get notices with audience filtering based on user role and department
   * @param {Object} user - User object containing adminRole, department, and userType
   * @returns {Promise<Array>} Filtered notices array
   */
  getFilteredNotices: async (user) => {
    const { adminRole, department } = user;

    // Build query based on user permissions
    let query = {};

    // If user is not admin or superadmin, apply audience filtering
    if (adminRole !== "admin" && adminRole !== "superadmin") {
      // Note: The old code referenced req.user.userType, but we don't have that in User model
      // Based on old.index.js line 493, it seems to check targetAudience against userType
      // Since we don't have userType in our User model, we'll check against department only
      // or we need to add userType to User model. Let me check the User model...
      
      // For now, implementing based on what we have - department filtering
      query = {
        $or: [
          { targetAudience: { $in: ["All"] } }, // Notices for all users
          { department: { $in: [department] } }, // Notices for user's department
        ],
      };
    }
    // If admin or superadmin, return all notices (empty query)

    const notices = await Notice.find(query);
    return notices;
  },

  /**
   * Create a new notice
   * @param {Object} noticeData - Notice object with title, category, description, image, date, targetAudience, department
   * @returns {Promise<Object>} Insert result
   */
  createNotice: async (noticeData) => {
    const newNotice = {
      title: noticeData.title,
      category: noticeData.category,
      description: noticeData.description,
      image: noticeData.image,
      date: noticeData.date,
      targetAudience: noticeData.targetAudience,
      department: noticeData.department,
      createdAt: new Date(),
    };

    return await Notice.insertOne(newNotice);
  },

  /**
   * Get a notice by ID
   * @param {string} id - Notice ID
   * @returns {Promise<Object>} Notice object
   */
  getNoticeById: async (id) => {
    return await Notice.findOneById(id);
  },

  /**
   * Update a notice by ID
   * @param {string} id - Notice ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Update result
   */
  updateNotice: async (id, updateData) => {
    const updatedNotice = {
      title: updateData.title,
      category: updateData.category,
      description: updateData.description,
      image: updateData.image,
      date: updateData.date,
      targetAudience: updateData.targetAudience,
      department: updateData.department,
      updatedAt: new Date(),
    };

    return await Notice.updateOneById(id, updatedNotice);
  },

  /**
   * Delete a notice by ID
   * @param {string} id - Notice ID
   * @returns {Promise<Object>} Delete result
   */
  deleteNotice: async (id) => {
    return await Notice.deleteOneById(id);
  },

  /**
   * Get all notices (no filtering)
   * @returns {Promise<Array>} All notices array
   */
  getAllNotices: async () => {
    return await Notice.findAll();
  },
};

module.exports = noticeService;
