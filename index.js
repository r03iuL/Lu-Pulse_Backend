const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "https://lupulse1.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Multer Storage Configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "LuPulse",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage: storage });

// MongoDB Connection
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Logging Middleware
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

const logError = (error, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${error.message}`);
  next(error);
};

app.use(logRequest);
app.use(logError);

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();

    // Database & Collections
    const database = client.db("LuPulse");
    const eventsCollection = database.collection("Events");
    const noticeCollection = database.collection("Notices");
    const userCollection = database.collection("Users");

    // Middleware to verify JWT token
    const verifyToken = async (req, res, next) => {
      const token = req.cookies.token;

      if (!token) {
        return res
          .status(401)
          .json({ message: "Unauthorized: Please log in to access this resource." });
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Forbidden: Invalid or expired token. Please log in again." });
        }

        try {
          const user = await userCollection.findOne({ email: decoded.email });

          if (!user) {
            return res
              .status(404)
              .json({ message: "User not found: The account associated with this token does not exist." });
          }

          req.user = {
            email: user.email,
            adminRole: user.adminRole || "user",
            department: user.department,
          };

          next();
        } catch (error) {
          console.error("Error verifying user:", error);
          res
            .status(500)
            .json({ message: "Internal Server Error: Unable to verify your account. Please try again later." });
        }
      });
    };

    // Middleware to verify Admin role
    const verifyAdmin = (req, res, next) => {
      if (
        !req.user ||
        (req.user.adminRole !== "admin" && req.user.adminRole !== "superadmin")
      ) {
        return res
          .status(403)
          .json({ message: "Forbidden: You do not have permission to access this resource." });
      }
      next();
    };

    // Middleware to verify SuperAdmin role
    const verifySuperAdmin = (req, res, next) => {
      if (!req.user || req.user.adminRole !== "superadmin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Superadmin access is required to perform this action." });
      }
      next();
    };

    // API for User Authentication (Login) - Generates JWT Token
    app.post("/login", async (req, res) => {
      const { uid, email, emailVerified } = req.body;

      try {
        const user = await userCollection.findOne({ email });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found: The provided email does not match any account." });
        }

        if (!emailVerified) {
          return res
            .status(403)
            .json({ message: "Email not verified: Please verify your email before logging in." });
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
          { expiresIn: "1h" }
        );

        res.cookie("token", token, {
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        res.status(200).json({ message: "Login successful. Welcome back!", success: true });
      } catch (error) {
        console.error("Login Error:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to process your login request. Please try again later." });
      }
    });

    // API for User Authentication (Logout) - Clears JWT Token
    app.post("/logout", (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });
      res.status(200).json({ message: "Logout successful. You have been signed out." });
    });

    // API for User Registration (Signup)
    app.post("/signup", async (req, res) => {
      try {
        const {
          fullName,
          id,
          email,
          userType,
          designation,
          department,
          image,
        } = req.body;

        if (!fullName || !id || !email || !userType || !department) {
          return res
            .status(400)
            .json({ message: "Validation Error: All required fields must be provided." });
        }

        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "Account already exists: The provided email is already registered." });
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

        await userCollection.insertOne(userData);
        res
          .status(201)
          .json({ message: "Registration successful. Welcome to LuPulse!", user: userData });
      } catch (error) {
        console.error("Signup Error:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to complete your registration. Please try again later." });
      }
    });

    // API to Fetch All Users
    app.get("/users", async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to retrieve user data. Please try again later." });
      }
    });

    // API to Fetch a Specific User by Email
    app.get("/users/:email", verifyToken, async (req, res) => {
      const { email } = req.params;
      const tokenEmail = req.user.email;
      const adminRole = req.user.adminRole;

      try {
        if (
          email !== tokenEmail &&
          adminRole !== "admin" &&
          adminRole !== "superadmin"
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: You can only access your own account information." });
        }

        const user = await userCollection.findOne({
          email: { $regex: new RegExp(`^${email}$`, "i") },
        });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found: The requested account does not exist." });
        }

        res.status(200).json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to retrieve user data. Please try again later." });
      }
    });

    // API to Update User Profile
    app.patch("/users/:email", verifyToken, async (req, res) => {
      const { email } = req.params;
      const { fullName, designation, image } = req.body;

      try {
        if (
          email !== req.user.email &&
          req.user.adminRole !== "admin" &&
          req.user.adminRole !== "superadmin"
        ) {
          return res
            .status(403)
            .json({ message: "Forbidden: You can only update your own profile." });
        }

        if (!fullName || !designation) {
          return res
            .status(400)
            .json({ message: "Validation Error: Full Name and Designation are required." });
        }

        const updatedUser = { fullName, designation };

        if (image) {
          updatedUser.image = image;
        }

        const result = await userCollection.updateOne(
          { email },
          { $set: updatedUser }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({ message: "No changes made: The user profile was not updated." });
        }

        res.status(200).json({
          message: "Profile updated successfully. Your changes have been saved.",
          user: { ...updatedUser, email },
        });
      } catch (error) {
        console.error("Error updating user profile:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to update your profile. Please try again later." });
      }
    });

    // API to Update User Role to Admin
    app.patch(
      "/users/:email/role",
      verifyToken,
      verifySuperAdmin,
      async (req, res) => {
        try {
          const { email } = req.params;

          const user = await userCollection.findOne({ email });
          if (!user) {
            return res
              .status(404)
              .json({ message: "User not found: The requested account does not exist." });
          }

          if (user.adminRole === "admin" || user.adminRole === "superadmin") {
            return res
              .status(400)
              .json({ message: "Validation Error: The user is already an Admin or SuperAdmin." });
          }

          const result = await userCollection.updateOne(
            { email },
            { $set: { adminRole: "admin" } }
          );

          if (result.modifiedCount === 0) {
            return res
              .status(500)
              .json({ message: "Internal Server Error: Unable to update the user role." });
          }

          res
            .status(200)
            .json({ message: "User role updated successfully. The user is now an Admin." });
        } catch (error) {
          console.error("Error promoting user:", error);
          res
            .status(500)
            .json({ message: "Internal Server Error: Unable to update the user role. Please try again later." });
        }
      }
    );

    // API to Demote an Admin to Regular User
    app.patch(
      "/users/:email/demote",
      verifyToken,
      verifySuperAdmin,
      async (req, res) => {
        try {
          const { email } = req.params;

          const user = await userCollection.findOne({ email });
          if (!user) {
            return res
              .status(404)
              .json({ message: "Admin not found: The requested account does not exist." });
          }

          if (user.adminRole === "superadmin") {
            return res
              .status(403)
              .json({ message: "Forbidden: Superadmins cannot be demoted." });
          }

          const result = await userCollection.updateOne(
            { email },
            { $set: { adminRole: "user" } }
          );

          if (result.modifiedCount === 0) {
            return res
              .status(500)
              .json({ message: "Internal Server Error: Unable to demote the admin." });
          }

          res.status(200).json({ message: "Admin demoted successfully. The user is now a regular user." });
        } catch (error) {
          console.error("Error demoting admin:", error);
          res
            .status(500)
            .json({ message: "Internal Server Error: Unable to demote the admin. Please try again later." });
        }
      }
    );

    // API to Delete User
    app.delete("/users/:email", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { email } = req.params;

        const user = await userCollection.findOne({ email });
        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found: The requested account does not exist." });
        }

        if (user.adminRole === "superadmin") {
          return res
            .status(403)
            .json({ message: "Forbidden: Superadmins cannot be deleted." });
        }

        const result = await userCollection.deleteOne({ email });

        if (result.deletedCount === 0) {
          return res
            .status(500)
            .json({ message: "Internal Server Error: Unable to delete the user." });
        }

        res.status(200).json({ message: "User deleted successfully. The account has been removed." });
      } catch (error) {
        console.error("Error deleting user:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to delete the user. Please try again later." });
      }
    });

    // API to Fetch All Events
    app.get("/events", async (req, res) => {
      try {
        const events = await eventsCollection.find().toArray();
        res.status(200).json(events);
      } catch (error) {
        console.error("Error fetching events:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to retrieve events. Please try again later." });
      }
    });

    // API to Fetch All Notices
    app.get("/notices", verifyToken, async (req, res) => {
      try {
        const { adminRole, department } = req.user;

        let query = {};

        if (adminRole !== "admin" && adminRole !== "superadmin") {
          query = {
            $or: [
              { targetAudience: { $in: ["All", req.user.userType] } },
              { department: { $in: [department] } },
            ],
          };
        }

        const notices = await noticeCollection.find(query).toArray();
        res.status(200).json(notices);
      } catch (error) {
        console.error("Error fetching notices:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to retrieve notices. Please try again later." });
      }
    });

    // API to Create New Notice
    app.post("/notices", verifyToken, verifyAdmin, async (req, res) => {
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

        const newNotice = {
          title,
          category,
          description,
          image,
          date,
          targetAudience,
          department,
          createdAt: new Date(),
        };

        const result = await noticeCollection.insertOne(newNotice);

        if (!result.insertedId) {
          return res
            .status(500)
            .json({ message: "Internal Server Error: Unable to create the notice." });
        }

        res
          .status(201)
          .json({ message: "Notice created successfully.", notice: newNotice });
      } catch (error) {
        console.error("Error creating notice:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to create the notice. Please try again later." });
      }
    });

    // API to Fetch a Specific Notice by ID
    app.get("/notices/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const notice = await noticeCollection.findOne({
          _id: new ObjectId(id),
        });

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
    });

    // API to Update an Existing Notice
    app.put("/notices/:id", verifyToken, verifyAdmin, async (req, res) => {
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

        const updatedNotice = {
          title,
          category,
          description,
          image,
          date,
          targetAudience,
          department,
          updatedAt: new Date(),
        };

        const result = await noticeCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedNotice }
        );

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ message: "Notice not found: The requested notice does not exist." });
        }

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
    });

    // API to Delete Notice
    app.delete("/notices/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;

        const result = await noticeCollection.deleteOne({
          _id: new ObjectId(id),
        });

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
    });

    // API to Create New Event with Image
    app.post("/events", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { name, date, time, venue, details, image } = req.body;

        if (!name || !date || !time || !venue || !details) {
          return res
            .status(400)
            .json({ message: "Validation Error: All fields are required." });
        }

        const newEvent = {
          name,
          date,
          time,
          venue,
          details,
          image: image || null,
          createdAt: new Date(),
        };

        const result = await eventsCollection.insertOne(newEvent);

        if (!result.insertedId) {
          return res
            .status(500)
            .json({ message: "Internal Server Error: Unable to create the event." });
        }

        res.status(201).json({
          message: "Event created successfully.",
          event: newEvent,
        });
      } catch (error) {
        console.error("Error creating event:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to create the event. Please try again later." });
      }
    });

    // API to Fetch a Specific Event by ID
    app.get("/events/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

        if (!event) {
          return res
            .status(404)
            .json({ message: "Event not found: The requested event does not exist." });
        }

        res.status(200).json(event);
      } catch (error) {
        console.error("Error fetching event:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to retrieve the event. Please try again later." });
      }
    });

    // API to Delete an Event by ID
    app.delete("/events/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;

        const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
        if (!event) {
          return res
            .status(404)
            .json({ message: "Event not found: The requested event does not exist." });
        }

        const result = await eventsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(500)
            .json({ message: "Internal Server Error: Unable to delete the event." });
        }

        res.status(200).json({ message: "Event deleted successfully. The event has been removed." });
      } catch (error) {
        console.error("Error deleting event:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to delete the event. Please try again later." });
      }
    });

    // API to Update an Event
    app.put("/events/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { name, date, time, venue, details, image } = req.body;

        if (!name || !date || !time || !venue || !details) {
          return res
            .status(400)
            .json({ message: "Validation Error: All fields are required." });
        }

        const updatedEvent = {
          name,
          date,
          time,
          venue,
          details,
          image,
          updatedAt: new Date(),
        };

        const result = await eventsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedEvent }
        );

        if (!result.matchedCount) {
          return res
            .status(404)
            .json({ message: "Event not found: The requested event does not exist." });
        }

        res.status(200).json({
          message: "Event updated successfully. Your changes have been saved.",
          event: updatedEvent,
        });
      } catch (error) {
        console.error("Error updating event:", error);
        res
          .status(500)
          .json({ message: "Internal Server Error: Unable to update the event. Please try again later." });
      }
    });

    // API to Upload Image to Cloudinary
    app.post("/upload-image", upload.single("image"), async (req, res) => {
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
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

run().catch(console.dir);

// Root Route Handler
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start Server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

module.exports = app;