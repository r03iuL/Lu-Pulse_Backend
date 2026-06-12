# AGENTS.md - LuPulse Backend Layered Architecture Conversion Plan

## Project Overview
Gradually convert old.index.js (monolithic Express app) into a layered architecture. The conversion follows a specific chronological build order, one step at a time.

## Target Folder Structure
lu-pulse-backend/
├── .env
├── .gitignore
├── package.json
├── README.md
├── index.js                      # Server entry point (binds port, imports src/app.js)
└── src/
    ├── app.js                    # Express app, global middlewares, master router
    ├── config/
    │   ├── db.js                 # MongoDB connection logic and DB pool exporter
    │   └── cloudinary.js         # Cloudinary configuration and Multer storage engine
    ├── middlewares/
    │   ├── authMiddleware.js     # verifyToken, verifyAdmin, verifySuperAdmin
    │   └── logMiddleware.js      # logRequest, logError
    ├── models/
    │   ├── User.js               # MongoDB collection operations for Users
    │   ├── Notice.js             # MongoDB collection operations for Notices
    │   └── Event.js              # MongoDB collection operations for Events
    ├── services/
    │   ├── authService.js        # Login processing, cookie options, token generation
    │   ├── userService.js        # Signup processing, role demotion/promotion
    │   ├── noticeService.js      # Audience filtering based on user types
    │   └── eventService.js       # Event timeline management, formatting, parsing
    ├── controllers/
    │   ├── authController.js     # /login, /logout requests/responses
    │   ├── userController.js     # Profile fetching, updates, role changes, signups
    │   ├── noticeController.js   # CRUD for notices
    │   ├── eventController.js    # CRUD for events
    │   └── uploadController.js   # File upload response payload
    └── routes/
        ├── apiRouter.js          # Master router, prefixes and combines sub-routes
        ├── authRoutes.js         # /login, /logout endpoints
        ├── userRoutes.js         # /users endpoints
        ├── noticeRoutes.js       # /notices endpoints
        ├── eventRoutes.js        # /events endpoints
        └── uploadRoutes.js       # /upload-image endpoint

## 🧱 Step-by-Step Chronological Build Order

### Foundation
1. Create src/app.js - Initialize Express with global middlewares (cors, express.json, cookieParser) + temporary / health check route
2. Create index.js (root) - Hook up server port listener targeting src/app.js
3. Create src/config/db.js - Extract MongoDB connection logic and DB pool exporter
4. Create src/middlewares/logMiddleware.js - Build logRequest and logError; plug into src/app.js. *(Note: Mount logRequest at the very top of the stack, and logError at the absolute bottom after all placeholder routes)*
5. Create src/config/cloudinary.js - Cloudinary config + Multer storage engine
6. Create src/middlewares/authMiddleware.js - verifyToken, verifyAdmin, verifySuperAdmin using JWT

### 👤 Feature Slice 1: Authentication & Users
7. Create src/models/User.js - Direct data access methods (findOne, insertOne, etc.) for Users collection
8. Create src/services/authService.js - Business logic for user validation, jwt.sign, token handling
9. Create src/services/userService.js - Registrations, profile updates, admin role transitions
10. Create src/controllers/authController.js - HTTP layer for /login, /logout
11. Create src/controllers/userController.js - Request parsers for fetch, profile changes, user removal
12. Create src/routes/authRoutes.js - Login/logout endpoints mapped to auth controller
13. Create src/routes/userRoutes.js - User management routes with token protection middlewares

### 📷 Feature Slice 2: Media Assets (Image Uploads)
14. Create src/controllers/uploadController.js - Payload controller for Multer uploads, formats Cloudinary URI response
15. Create src/routes/uploadRoutes.js - /upload-image route with storage engine interceptor

### 📋 Feature Slice 3: System Notices
16. Create src/models/Notice.js - Raw query pipelines for Notices collection
17. Create src/services/noticeService.js - Audience filtering, department/viewer classification logic
18. Create src/controllers/noticeController.js - CRUD execution, input validation, payload conversion
19. Create src/routes/noticeRoutes.js - Notice endpoints, write ops require admin tokens

### 📅 Feature Slice 4: Campus Events
20. Create src/models/Event.js - Data interface for Events collection
21. Create src/services/eventService.js - Data shaping, timeline parsing, text documentation/sanitization
22. Create src/controllers/eventController.js - Event manipulation controllers
23. Create src/routes/eventRoutes.js - Event endpoints, mutating ops secured, fetch public

### ⛓️ Final Wiring & Verification
24. Create src/routes/apiRouter.js - Unified routing hub, prefixes each feature router (/auth, /users, /notices, /events, /upload)
25. Update src/app.js - Remove temp routes, import master apiRouter, point global app traffic through it. *(Note: Ensure logError remains the final middleware in the stack, positioned after the apiRouter registration)*

## Rules & Constraints
- DO NOT alter README.md, old.index.js, or other existing files.
- Convert one step at a time - verify each step works before proceeding.
- **Middleware Execution Order:** Always ensure `logRequest` sits at the absolute top of the middleware lifecycle stack in `src/app.js`. Conversely, ensure `logError` sits at the absolute bottom of the stack (after all routes/routers have been mounted) to guarantee it catches unhandled downstream exceptions.
- After each step, prompt user for git commit before jumping to next step.
- Maintain exact same API behavior and response formats.
- Keep all environment variables in .env (MONGODB_URI, JWT_SECRET, CLOUD_NAME, etc.).
- Use existing dependencies from package.json - no new packages unless absolutely necessary.
- Follow existing code style and conventions from old.index.js. in the project root folder