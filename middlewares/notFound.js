const AppError = require("../utils/AppError");

// Create a 404 error when no route matches the request
module.exports = function notFound(req, res, next) {
  next(
    new AppError(
      404,
      `Route ${req.method} ${req.originalUrl} was not found`
    )
  );
};


