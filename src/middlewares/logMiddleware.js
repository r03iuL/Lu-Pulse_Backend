const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

const logError = (error, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${error.message}`);
  next(error);
};

module.exports = { logRequest, logError };