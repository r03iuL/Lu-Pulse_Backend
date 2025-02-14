const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token found!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token!" });
    }

    req.user = decoded; //  Attach decoded user data to request
    next();
  });
};

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
    const AdminCollection = database.collection("Admins");

    // User Authentication (Login) - Generates JWT Token
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
      return res.status(403).json({ message: "Email is not verified. Please verify your email before logging in." });
    }

    // Generate JWT Token with `isAdmin` field
    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isAdmin: user.isAdmin,
        department: user.department, 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Set expiration time
    );

    // Store JWT in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true if your website is served over HTTPS
    });

    res.status(200).json({ message: "Login successful", success: true });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


    // User Authentication (Logout) - Clears JWT Token
    app.post("/logout", (req, res) => {
      res.clearCookie("token", { httpOnly: true, secure: false }); // Clears the JWT cookie
      res.status(200).json({ message: "Logout successful" });
    });
    

    // User Registration (Signup)
    app.post("/signup", async (req, res) => {
      try {
        const { fullName, id, email, userType, designation, department, image } = req.body;
        
        if (!fullName || !id || !email || !userType || !designation || !department ) {
          return res.status(400).json({ message: "All fields are required" });
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
          designation: userType === "faculty" || userType === "staff" ? designation : null,
          createdAt: new Date(),
          isAdmin: false,
        };
        
        await userCollection.insertOne(userData);
        res.status(201).json({ message: "User registered successfully", user: userData });
      } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
      }
    });

    // Fetch All Users
    app.get("/users", async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
      }
    });

    // Fetch a Specific User by Email
    app.get("/users/:email", verifyToken, async (req, res) => {
      const { email } = req.params; // Email from request
      const tokenEmail = req.user.email; // Email from JWT token
      const isAdmin = req.user.isAdmin; // Admin status from JWT token
    
      try {
        //  Allow only the authenticated user OR an admin to access the data
        if (email !== tokenEmail && !isAdmin) {
          return res.status(403).json({ message: "Forbidden: You can only access your own data!" });
        }
    
        // Fetch user from MongoDB
        const user = await userCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        res.status(200).json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    

    // Fetch All Events
    app.get("/events", async (req, res) => {
      try {
        const events = await eventsCollection.find().toArray();
        res.status(200).json(events);
      } catch (error) {
        res.status(500).json({ message: "Error fetching events", error });
      }
    });

    // Fetch All Notices
    app.get("/notices", async (req, res) => {
      try {
        const notices = await noticeCollection.find().toArray();
        res.status(200).json(notices);
      } catch (error) {
        res.status(500).json({ message: "Error fetching notices", error });
      }
    });

    // Upload Image to Cloudinary
    app.post("/upload-image", upload.single("image"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        res.status(200).json({ success: true, message: "Image uploaded successfully", imageUrl: req.file.path });
      } catch (error) {
        res.status(500).json({ success: false, message: "Error uploading image" });
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
