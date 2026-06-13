const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("../config/db");

let userCollectionPromise = null;

async function getUserCollection() {
  if (!userCollectionPromise) {
    userCollectionPromise = connectToDatabase().then((db) =>
      db.collection("Users"),
    );
  }
  return userCollectionPromise;
}

const verifyToken = async (req, res, next) => {
  // Check Authorization: Bearer <token> header first (used for cross-origin
  // requests where cookies are blocked by browser third-party cookie policies).
  // Fall back to the HttpOnly cookie for same-site or legacy requests.
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  if (!token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res
      .status(401)
      .json({
        message: "Unauthorized: Please log in to access this resource.",
      });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userCollection = await getUserCollection();
    const user = await userCollection.findOne({ email: decoded.email });

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "User not found: The account associated with this token does not exist.",
        });
    }

    req.user = {
      email: user.email,
      adminRole: user.adminRole || "user",
      department: user.department,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res
        .status(403)
        .json({
          message: "Forbidden: Invalid or expired token. Please log in again.",
        });
    }
    console.error("Error verifying user:", error);
    res
      .status(500)
      .json({
        message:
          "Internal Server Error: Unable to verify your account. Please try again later.",
      });
  }
};

const verifyAdmin = (req, res, next) => {
  if (
    !req.user ||
    (req.user.adminRole !== "admin" && req.user.adminRole !== "superadmin")
  ) {
    return res
      .status(403)
      .json({
        message:
          "Forbidden: You do not have permission to access this resource.",
      });
  }
  next();
};

const verifySuperAdmin = (req, res, next) => {
  if (!req.user || req.user.adminRole !== "superadmin") {
    return res
      .status(403)
      .json({
        message:
          "Forbidden: Superadmin access is required to perform this action.",
      });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin, verifySuperAdmin };
