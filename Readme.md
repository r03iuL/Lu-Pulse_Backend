# LuPulse Backend

A secure and scalable **Node.js + Express.js** backend for **LuPulse**, a university platform for managing users, events, and notices — integrated with **MongoDB**, **JWT authentication**, and **Cloudinary image uploads**.

---

## Tech Stack

| Category                  | Technologies Used                   |
| ------------------------- | ----------------------------------- |
| **Runtime**               | Node.js                             |
| **Framework**             | Express.js                          |
| **Database**              | MongoDB (via MongoDB Atlas)         |
| **Auth**                  | JSON Web Tokens (JWT) + Cookies     |
| **File Uploads**          | Multer + Cloudinary                 |
| **Environment Variables** | dotenv                              |
| **CORS & Middleware**     | cors, cookie-parser                 |
| **Deployment Ready**      | Supports local and production modes |

---

## Features

- User Authentication (Signup, Login, Logout)
- Role-based Access Control (User / Admin / SuperAdmin)
- Secure JWT Token Verification via Cookies
- CRUD APIs for Users, Events, and Notices
- Cloudinary Image Upload Integration
- Request Logging & Error Handling Middleware
- Department-based Notice Filtering
- Admin and SuperAdmin Role Management
- RESTful API Design (GET, POST, PATCH, PUT, DELETE)

---

## Project Structure

```
lu-pulse-backend/
├── .env
├── package.json
├── index.js                    # Server entry point
└── src/
    ├── app.js                  # Express app, global middlewares, master router
    ├── config/
    │   ├── db.js               # MongoDB connection logic
    │   └── cloudinary.js       # Cloudinary config + Multer storage engine
    ├── middlewares/
    │   ├── authMiddleware.js   # verifyToken, verifyAdmin, verifySuperAdmin
    │   └── logMiddleware.js    # logRequest, logError
    ├── models/
    │   ├── User.js             # Data access for Users collection
    │   ├── Notice.js           # Data access for Notices collection
    │   └── Event.js            # Data access for Events collection
    ├── services/
    │   ├── authService.js      # Login processing, token generation
    │   ├── userService.js      # Signup, role management
    │   ├── noticeService.js    # Audience filtering
    │   └── eventService.js     # Event CRUD logic
    ├── controllers/
    │   ├── authController.js   # /login, /logout request handlers
    │   ├── userController.js   # User CRUD request handlers
    │   ├── noticeController.js # Notice CRUD request handlers
    │   ├── eventController.js  # Event CRUD request handlers
    │   └── uploadController.js # File upload response handler
    └── routes/
        ├── apiRouter.js        # Master router, prefixes sub-routes
        ├── authRoutes.js       # /auth endpoints
        ├── userRoutes.js       # /users endpoints
        ├── noticeRoutes.js     # /notices endpoints
        ├── eventRoutes.js      # /events endpoints
        └── uploadRoutes.js     # /upload endpoints
```

---

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
NODE_ENV=development
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/r03iuL/LuPulse-Backend.git
cd LuPulse-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Server (Development)

```bash
npm run dev
```

or

```bash
node index.js
```

### 4. Server will start at:

```
http://localhost:5000
```

---

## API Overview

### **Health Check**

| Method | Endpoint | Description                    | Auth   |
| ------ | -------- | ------------------------------ | ------ |
| `GET`  | `/`      | Service info, health, endpoints | Public |

### **Auth Routes** (prefix: `/auth`)

| Method | Endpoint       | Description              | Auth   |
| ------ | -------------- | ------------------------ | ------ |
| `POST` | `/auth/login`  | User login, generate JWT | Public |
| `POST` | `/auth/logout` | Clear JWT cookie         | Public |

> **Note:** User registration (signup) is handled via `/users` routes or external identity provider.

### **User Routes** (prefix: `/users`)

| Method   | Endpoint                  | Description              | Auth              |
| -------- | ------------------------- | ------------------------ | ----------------- |
| `GET`    | `/users`                  | Get all users            | Public            |
| `GET`    | `/users/:email`           | Get user by email        | Auth (Self/Admin) |
| `PATCH`  | `/users/:email`           | Update profile           | Auth (Self/Admin) |
| `PATCH`  | `/users/:email/role`      | Promote user to admin    | Auth (SuperAdmin) |
| `PATCH`  | `/users/:email/demote`    | Demote admin to user     | Auth (SuperAdmin) |
| `DELETE` | `/users/:email`           | Delete a user            | Auth (Admin)      |

### **Notice Routes** (prefix: `/notices`)

| Method | Endpoint            | Description                                   | Auth         |
| ------ | ------------------- | --------------------------------------------- | ------------ |
| `GET`  | `/notices`          | Get all notices (filtered by role/department) | Auth         |
| `GET`  | `/notices/:id`      | Get notice by ID                              | Auth         |
| `POST` | `/notices`          | Create a new notice                           | Auth (Admin) |
| `PUT`  | `/notices/:id`      | Update a notice                               | Auth (Admin) |
| `DELETE` | `/notices/:id`    | Delete a notice                               | Auth (Admin) |

### **Event Routes** (prefix: `/events`)

| Method | Endpoint          | Description              | Auth         |
| ------ | ----------------- | ------------------------ | ------------ |
| `GET`  | `/events`         | Get all events           | Public       |
| `GET`  | `/events/:id`     | Get specific event by ID | Public       |
| `POST` | `/events`         | Create new event         | Auth (Admin) |
| `PUT`  | `/events/:id`     | Update event             | Auth (Admin) |
| `DELETE` | `/events/:id`   | Delete event             | Auth (Admin) |

### **Upload Routes** (prefix: `/upload`)

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| `POST` | `/upload/upload-image`        | Upload image to Cloudinary |

> Upload image files using `multipart/form-data` with field name `"image"`.

---

## Authentication Flow

1. **User logs in** via `POST /auth/login` with verified credentials (`uid`, `email`, `emailVerified`).
2. Server validates user exists in MongoDB and email is verified.
3. Server generates a **JWT token** (7-day expiry) containing: `uid`, `email`, `emailVerified`, `adminRole`, `department`.
4. Token is stored in an **HTTP-only cookie** (`secure`, `sameSite: none` in production).
5. Token is **also returned in response body** for localStorage/Bearer token use (cross-origin compatibility).
6. **Protected routes** verify token using middleware:
   - `verifyToken` — Validates JWT, attaches user to `req.user`
   - `verifyAdmin` — Requires `adminRole === 'admin' || 'superadmin'`
   - `verifySuperAdmin` — Requires `adminRole === 'superadmin'`
7. **Logout** via `POST /auth/logout` clears the cookie securely.

### Health Check Endpoint

`GET /` returns service metadata and real-time health status:

```json
{
  "service": "LuPulse API",
  "tagline": "Your campus pulse - events, notices & community",
  "version": "1.0.0",
  "status": "operational",
  "uptime": "2d 14h 32m",
  "timestamp": "2026-06-13T10:30:00.000Z",
  "environment": "production",
  "database": { "status": "connected", "type": "MongoDB", "database": "LuPulse" },
  "endpoints": { "auth": ["/login", "/logout", "/signup"], ... },
  "repository": "https://github.com/r03iuL/Lu-Pulse_Backend"
}
```

- **Uptime**: Calculated from `process.uptime()`
- **Timestamp**: ISO 8601 at request time
- **Database status**: Real-time MongoDB ping (`db.command({ ping: 1 })`)

---

## Middleware Execution Order

| Order | Middleware              | Purpose                              |
| ----- | ----------------------- | ------------------------------------ |
| 1     | `logRequest()`          | Logs each incoming request           |
| 2     | `cors()`                | Enables cross-origin access          |
| 3     | `express.json()`        | Parses JSON request bodies           |
| 4     | `cookieParser()`        | Reads cookies from requests          |
| 5     | Routes + Auth middlewares | API logic + token verification     |
| Last  | `logError()`            | Catches unhandled downstream errors  |

---

## Cloudinary Integration

- Configured via environment variables.
- Uses **Multer-Storage-Cloudinary** to directly upload images.
- Uploaded files are stored in the `LuPulse` folder on your Cloudinary account.

---

## Example API Request

**POST /auth/login**

```json
{
  "uid": "CSE12345",
  "email": "john@lus.ac.bd",
  "emailVerified": true
}
```

**Response**

```json
{
  "message": "Login successful. Welcome back!",
  "success": true
}
```

---

## Deployment

You can deploy easily on:

- **Render**
- **Railway**
- **Vercel**

> Make sure to:
> - Set all environment variables in the hosting platform.
> - Enable `CORS` for your production frontend domain.
