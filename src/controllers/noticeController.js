const NoticeService = require("../services/noticeService");

/**
 * Get notices with audience filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNotices = async (req, res) => {
  try {
    const { adminRole, department } = req.user;
    
    // Build query based on user permissions
    let query = {};

    // If user is not admin or superadmin, apply audience filtering
    if (adminRole !== "admin" && adminRole !== "superadmin") {
      query = {
        $or: [
          { targetAudience: { $in: ["All"] } },
          { department: { $in: [department] } },
        ],
      };
    }

    const notices = await NoticeService.getFilteredNotices(req.user);
    res.status(200).json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to retrieve notices. Please try again later." });
  }
};

/**
 * Create a new notice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createNotice = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      image,
      date,
      targetAudience,
      department,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !category ||
      !description ||
      !date ||
      !targetAudience ||
      !department
    ) {
      return res
        .status(400)
        .json({ message: "Validation Error: All fields are required." });
    }

    const noticeData = {
      title,
      category,
      description,
      image,
      date,
      targetAudience,
      department,
    };

    const result = await NoticeService.createNotice(noticeData);

    if (!result.insertedId) {
      return res
        .status(500)
        .json({ message: "Internal Server Error: Unable to create the notice." });
    }

    const newNotice = {
      ...noticeData,
      createdAt: new Date(),
    };

    res
      .status(201)
      .json({ message: "Notice created successfully.", notice: newNotice });
  } catch (error) {
    console.error("Error creating notice:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to create the notice. Please try again later." });
  }
};

/**
 * Get a specific notice by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await NoticeService.getNoticeById(id);

    if (!notice) {
      return res
        .status(404)
        .json({ message: "Notice not found: The requested notice does not exist." });
    }

    res.status(200).json(notice);
  } catch (error) {
    console.error("Error fetching notice:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to retrieve the notice. Please try again later." });
  }
};

/**
 * Update an existing notice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      description,
      image,
      date,
      targetAudience,
      department,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !category ||
      !description ||
      !date ||
      !targetAudience ||
      !department
    ) {
      return res
        .status(400)
        .json({ message: "Validation Error: All fields are required." });
    }

    const updateData = {
      title,
      category,
      description,
      image,
      date,
      targetAudience,
      department,
    };

    const result = await NoticeService.updateNotice(id, updateData);

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Notice not found: The requested notice does not exist." });
    }

    const updatedNotice = {
      ...updateData,
      updatedAt: new Date(),
    };

    res.status(200).json({
      message: "Notice updated successfully. Your changes have been saved.",
      notice: updatedNotice,
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to update the notice. Please try again later." });
  }
};

/**
 * Delete a notice
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await NoticeService.deleteNotice(id);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Notice not found: The requested notice does not exist." });
    }

    res.status(200).json({ message: "Notice deleted successfully. The notice has been removed." });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error: Unable to delete the notice. Please try again later." });
  }
};

module.exports = {
  getNotices,
  createNotice,
  getNoticeById,
  updateNotice,
  deleteNotice
};
