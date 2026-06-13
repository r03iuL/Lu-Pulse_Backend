/**
 * Upload image controller - Handles file upload response
 * @param {Object} req - Express request object (should have req.file from multer)
 * @param {Object} res - Express response object
 */
const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Validation Error: No file uploaded." });
    }
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: req.file.path,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error: Unable to upload the image. Please try again later." });
  }
};

module.exports = { uploadImage };
