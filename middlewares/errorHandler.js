function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errors: []
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || 500;
  let mappedMessage = error.message;
  if ([2601, 2627].includes(error.number)) {
    statusCode = 409;
    mappedMessage = "A record with the same unique value already exists";
  } else if (error.number === 547) {
    statusCode = 400;
    mappedMessage = "The request conflicts with a database relationship or validation rule";
  }
  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error({
      message: mappedMessage,
      code: error.code,
      method: req.method,
      path: req.originalUrl,
      stack: isProduction ? undefined : error.stack
    });
  }

  const message =
    statusCode >= 500 && isProduction
      ? "An unexpected server error occurred"
      : mappedMessage || "An unexpected server error occurred";

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || []
  });
}

module.exports = { notFound, errorHandler };
