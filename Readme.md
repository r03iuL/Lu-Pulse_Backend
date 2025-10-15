![LuPulse Frontend Homepage](/assets/screenshot.png)
# 🌀 LuPulse Backend

A secure and scalable **Node.js + Express.js** backend for **LuPulse**, a university platform for managing users, events, and notices — integrated with **MongoDB**, **JWT authentication**, and **Cloudinary image uploads**.

---

## 🚀 Tech Stack

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

## ⚙️ Features

✅ User Authentication (Signup, Login, Logout) <br>
✅ Role-based Access Control (User / Admin / SuperAdmin) <br>
✅ Secure JWT Token Verification via Cookies <br>
✅ CRUD APIs for Users, Events, and Notices <br>
✅ Cloudinary Image Upload Integration <br>
✅ Request Logging & Error Handling Middleware <br>
✅ Department-based Notice Filtering <br>
✅ Admin and SuperAdmin Role Management <br>
✅ RESTful API Design (GET, POST, PATCH, PUT, DELETE) <br>

---

## 📁 Project Structure

```
LuPulse-Backend/
│
├── .env                # Environment variables
├── package.json        # Dependencies
├── index.js            # Main Express application
└── README.md           # Project documentation
```

---

## 🔑 Environment Variables

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

## 🧩 Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/r03iuL/LuPulse-Backend.git
cd LuPulse-Backend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Run the Server (Development)

```bash
npm run dev
```

or

```bash
node index.js
```

### 4️⃣ Server will start at:

```
http://localhost:5000
```

---

## 🧠 API Overview

### 🧍‍♂️ **User Routes**

| Method   | Endpoint               | Description              | Auth              |
| -------- | ---------------------- | ------------------------ | ----------------- |
| `POST`   | `/signup`              | Register a new user      | Public            |
| `POST`   | `/login`               | User login, generate JWT | Public            |
| `POST`   | `/logout`              | Clear JWT cookie         | Auth              |
| `GET`    | `/users`               | Get all users            | Auth (Admin)      |
| `GET`    | `/users/:email`        | Get user by email        | Auth (Self/Admin) |
| `PATCH`  | `/users/:email`        | Update profile           | Auth (Self/Admin) |
| `PATCH`  | `/users/:email/role`   | Promote user to admin    | Auth (SuperAdmin) |
| `PATCH`  | `/users/:email/demote` | Demote admin to user     | Auth (SuperAdmin) |
| `DELETE` | `/users/:email`        | Delete a user            | Auth (Admin)      |

---

### 📢 **Notice Routes**

| Method   | Endpoint       | Description                                   | Auth         |
| -------- | -------------- | --------------------------------------------- | ------------ |
| `GET`    | `/notices`     | Get all notices (filtered by role/department) | Auth         |
| `GET`    | `/notices/:id` | Get notice by ID                              | Auth         |
| `POST`   | `/notices`     | Create a new notice                           | Auth (Admin) |
| `PUT`    | `/notices/:id` | Update a notice                               | Auth (Admin) |
| `DELETE` | `/notices/:id` | Delete a notice                               | Auth (Admin) |

---

### 🎉 **Event Routes**

| Method   | Endpoint      | Description              | Auth         |
| -------- | ------------- | ------------------------ | ------------ |
| `GET`    | `/events`     | Get all events           | Public       |
| `GET`    | `/events/:id` | Get specific event by ID | Public       |
| `POST`   | `/events`     | Create new event         | Auth (Admin) |
| `PUT`    | `/events/:id` | Update event             | Auth (Admin) |
| `DELETE` | `/events/:id` | Delete event             | Auth (Admin) |

---

### 🖼️ **Upload Routes**

| Method | Endpoint        | Description                |
| ------ | --------------- | -------------------------- |
| `POST` | `/upload-image` | Upload image to Cloudinary |

> Upload image files using `multipart/form-data` with field name `"image"`.

---

## 🔒 Authentication Flow

1. User logs in with verified credentials.
2. Server generates a **JWT token** and stores it in a **HTTP-only cookie**.
3. Protected routes verify this token using middleware:

   * `verifyToken` → Ensures valid login.
   * `verifyAdmin` → Restricts access to admins and superadmins.
   * `verifySuperAdmin` → Grants exclusive access to superadmins.
4. On logout, the cookie is cleared securely.

---

## 🧰 Middlewares

| Middleware           | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `cors()`             | Enables cross-origin access from frontend |
| `express.json()`     | Parses JSON request bodies                |
| `cookieParser()`     | Reads cookies from requests               |
| `logRequest()`       | Logs each incoming request                |
| `logError()`         | Logs error stack traces                   |
| `verifyToken()`      | Validates JWT and extracts user data      |
| `verifyAdmin()`      | Restricts routes to admin/superadmin      |
| `verifySuperAdmin()` | Restricts routes to superadmin only       |

---

## ☁️ Cloudinary Integration

* Configured via environment variables.
* Uses **Multer-Storage-Cloudinary** to directly upload images.
* Uploaded files are stored in the `LuPulse` folder on your Cloudinary account.

---

## 🧩 Example API Request

**POST /signup**

```json
{
  "fullName": "John Doe",
  "id": "CSE12345",
  "email": "john@lus.ac.bd",
  "userType": "student",
  "designation": "N/A",
  "department": "CSE",
  "image": "https://res.cloudinary.com/xyz/image.jpg"
}
```

**Response**

```json
{
  "message": "Registration successful. Welcome to LuPulse!",
  "user": {
    "fullName": "John Doe",
    "email": "john@lus.ac.bd",
    "department": "CSE"
  }
}
```
---

## 🧱 Deployment

You can deploy easily on:

* **Render**
* **Railway**
* **Vercel** 
> Make sure to:
> * Set all environment variables in the hosting platform.
> * Enable `CORS` for your production frontend domain.

---


