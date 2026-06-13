const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { logRequest, logError } = require('./middlewares/logMiddleware');
const apiRouter = require('./routes/apiRouter');

const app = express();

// Mount logRequest at the very top of the middleware stack
app.use(logRequest);

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/', apiRouter);

// Mount logError at the absolute bottom of the stack
app.use(logError);

module.exports = app;
