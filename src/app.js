const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { logRequest, logError } = require('./middlewares/logMiddleware');

const app = express();

// Mount logRequest at the very top of the middleware stack
app.use(logRequest);

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Temporary route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// Mount logError at the absolute bottom of the stack
app.use(logError);

module.exports = app;