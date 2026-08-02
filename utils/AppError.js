// Create a custom application error
class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);

    // Store the error details
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

module.exports = AppError;
