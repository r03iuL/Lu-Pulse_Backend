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
    origin: "http://localhost:5173",
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
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lpjeu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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
          .json({ message: "Unauthorized: No token found!" });
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Forbidden: Invalid token!" });
        }

        try {
          // Fetch user data from database
          const user = await userCollection.findOne({ email: decoded.email });

          if (!user) {
            return res.status(404).json({ message: "User not found!" });
          }

          req.user = {
            email: user.email,
            adminRole: user.adminRole || "user",
            department: user.department,
          };

          next();
        } catch (error) {
          console.error("Error verifying user:", error);
          res.status(500).json({ message: "Internal Server Error" });
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
          .json({ message: "Forbidden: Admin access required!" });
      }
      next();
    };

    // Middleware to verify SuperAdmin role
    const verifySuperAdmin = (req, res, next) => {
      if (!req.user || req.user.adminRole !== "superadmin") {
        return res
          .status(403)
          .json({ message: "Forbidden: Superadmin access required!" });
      }
      next();
    };

    // API for User Authentication (Login) - Generates JWT Token
    app.post("/login", async (req, res) => {
      const { uid, email, emailVerified } = req.body;

      try {
        // Fetch user from MongoDB
        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if email is verified
        if (!emailVerified) {
          return res.status(403).json({
            message:
              "Email is not verified. Please verify your email before logging in.",
          });
        }

        // Generate JWT Token with user data
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

        // Store JWT in HttpOnly cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
        });

        res.status(200).json({ message: "Login successful", success: true });
      } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // API for User Authentication (Logout) - Clears JWT Token
    app.post("/logout", (req, res) => {
      res.clearCookie("token", { httpOnly: true, secure: false });
      res.status(200).json({ message: "Logout successful" });
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
            .json({ message: "All required fields must be provided" });
        }

        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
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
          .json({ message: "User registered successfully", user: userData });
      } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
      }
    });

    // API to Fetch All Users
    app.get("/users", async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
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
            .json({ message: "Forbidden: You can only access your own data!" });
        }

        const user = await userCollection.findOne({
          email: { $regex: new RegExp(`^${email}$`, "i") },
        });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    
    // API to Update User Profile
    app.patch("/users/:email", verifyToken, async (req, res) => {
      const { email } = req.params;
      const { fullName, designation, image } = req.body;

      try {
        // Check if user is trying to update their own profile or if they're an admin
        if (
          email !== req.user.email &&
          req.user.adminRole !== "admin" &&
          req.user.adminRole !== "superadmin"
        ) {
          return res
            .status(403)
            .json({
              message: "Forbidden: You can only update your own profile.",
            });
        }

        // Validate that required fields are provided
        if (!fullName || !designation) {
          return res
            .status(400)
            .json({ message: "Full Name and Designation are required." });
        }

        const updatedUser = { fullName, designation };

        // If an image URL is being provided, use it (no need to handle image upload here)
        if (image) {
          updatedUser.image = image; // Set the image URL directly
        }

        // Update the user document in MongoDB
        const result = await userCollection.updateOne(
          { email },
          { $set: updatedUser }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({ message: "User not found or no changes made" });
        }

        // Return success message with updated user data
        res.status(200).json({
          message: "Profile updated successfully",
          user: { ...updatedUser, email },
        });
      } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
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

          const role = "admin";

          const result = await userCollection.updateOne(
            { email },
            { $set: { adminRole: role } }
          );

          if (result.modifiedCount === 0) {
            return res
              .status(404)
              .json({ message: "User not found or already an admin." });
          }

          res
            .status(200)
            .json({ message: "User promoted to admin successfully." });
        } catch (error) {
          console.error("Error updating user role:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      }
    );

    // API to Fetch All Events
    app.get("/events", async (req, res) => {
      try {
        const events = await eventsCollection.find().toArray();
        res.status(200).json(events);
      } catch (error) {
        res.status(500).json({ message: "Error fetching events", error });
      }
    });

    // API to Fetch All Notices
    app.get("/notices", verifyToken, async (req, res) => {
      try {
        const { adminRole, department } = req.user;

        let query = {};

        // If the user is NOT an admin/superadmin, apply filtering
        if (adminRole !== "admin" && adminRole !== "superadmin") {
          query = {
            $or: [
              { targetAudience: { $in: ["All", req.user.userType] } },
              { department: { $in: [department] } },
            ],
          };
        }

        // Fetch notices based on the query
        const notices = await noticeCollection.find(query).toArray();

        res.status(200).json(notices);
      } catch (error) {
        console.error("Error fetching notices:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
          return res.status(400).json({ message: "All fields are required" });
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
          return res.status(500).json({ message: "Failed to create notice" });
        }

        res
          .status(201)
          .json({ message: "Notice created successfully", notice: newNotice });
      } catch (error) {
        console.error("Error creating notice:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
          return res.status(404).json({ message: "Notice not found" });
        }

        res.json(notice);
      } catch (error) {
        console.error("Error fetching notice:", error);
        res.status(500).json({ message: "Internal server error" });
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

        // Ensure required fields are provided
        if (
          !title ||
          !category ||
          !description ||
          !date ||
          !targetAudience ||
          !department
        ) {
          return res.status(400).json({ message: "All fields are required" });
        }

        // Construct the update object
        const updatedNotice = {
          title,
          category,
          description,
          image, // Can be new or existing image URL
          date,
          targetAudience,
          department,
          updatedAt: new Date(),
        };

        // Find and update the notice
        const result = await noticeCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedNotice }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Notice not found" });
        }

        res.status(200).json({
          message: "Notice updated successfully",
          notice: updatedNotice,
        });
      } catch (error) {
        console.error("Error updating notice:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
          return res.status(404).json({ message: "Notice not found" });
        }

        res.status(200).json({ message: "Notice deleted successfully" });
      } catch (error) {
        console.error("Error deleting notice:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // API to Create New Event with Image
    app.post("/events", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { name, date, time, venue, details, image } = req.body;

        // Ensure required fields are provided
        if (!name || !date || !time || !venue || !details) {
          return res.status(400).json({ message: "All fields are required" });
        }

        // Construct the new event object (including image URL)
        const newEvent = {
          name,
          date,
          time,
          venue,
          details,
          image: image || null, // Store image URL if provided
          createdAt: new Date(),
        };

        // Insert the event into the database
        const result = await eventsCollection.insertOne(newEvent);

        if (!result.insertedId) {
          return res.status(500).json({ message: "Failed to create event" });
        }

        res.status(201).json({
          message: "Event created successfully",
          event: newEvent,
        });
      } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // API to Fetch a Specific Event by ID
    app.get("/events/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json(event);
      } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // API to Delete an Event by ID
    app.delete("/events/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;

        // Check if the event exists
        const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        // Delete the event
        const result = await eventsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(500).json({ message: "Failed to delete event" });
        }

        res.status(200).json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // API to Update an Event
    app.put("/events/:id", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { name, date, time, venue, details, image } = req.body;

        if (!name || !date || !time || !venue || !details) {
          return res.status(400).json({ message: "All fields are required" });
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

        if (!result.matchedCount)
          return res.status(404).json({ message: "Event not found" });

        res
          .status(200)
          .json({ message: "Event updated successfully", event: updatedEvent });
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // API to Upload Image to Cloudinary
    app.post("/upload-image", upload.single("image"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        res.status(200).json({
          success: true,
          message: "Image uploaded successfully",
          imageUrl: req.file.path,
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Error uploading image" });
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
