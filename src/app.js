const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Temporary health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

module.exports = app;