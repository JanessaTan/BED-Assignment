// Convert database errors into HTTP responses
function databaseError(error) {
  const number = Number(
    error.number || error.originalError?.info?.number
  );
  if ([2601, 2627].includes(number)) {
    return {
      statusCode: 409,
      message: "A record with the same unique value already exists"
    };
  }
  if (number === 547) {
    return {
      statusCode: 409,
      message: "This operation conflicts with related records"
    };
  }
  if (number === 515) {
    return {
      statusCode: 400,
      message: "A required database value is missing"
    };
  }
  if (number === 50003) {
    return {
      statusCode: 403,
      message:
        error.message ||
        "The resource is outside your managed scope"
    };
  }
  if (number === 50004) {
    return {
      statusCode: 409,
      message:
        error.message ||
        "The stall has no active vendor owner"
    };
  }
  if (number >= 51000 && number < 52000) {
    return {
      statusCode: 400,
      message:
        error.message ||
        "A database business rule rejected the request"
    };
  }
  return null;
}
// Handle application and database errors
module.exports = function errorHandler(
  error,
  req,
  res,
  next
) {
  if (res.headersSent) {
    return next(error);
  }
  const mappedError = databaseError(error);
  const invalidJson = error.type === "entity.parse.failed";
  const statusCode = invalidJson
    ? 400
    : mappedError?.statusCode || error.statusCode || 500;
  const message = invalidJson
    ? "Request body contains invalid JSON"
    : mappedError?.message ||
      (statusCode === 500
        ? "An unexpected server error occurred"
        : error.message);
  const body = {
    success: false,
    message
  };
  if (error.errors) {
    body.errors = error.errors;
  }
  if (
    process.env.NODE_ENV !== "production" &&
    statusCode === 500
  ) {
    body.developmentMessage = error.message;
  }
  return res.status(statusCode).json(body);
};