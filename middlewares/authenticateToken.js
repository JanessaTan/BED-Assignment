const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/tokenUtils");

// Check that the request has a valid authentication token
function authenticateToken(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  // Stop the request when no Bearer token is provided
  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError(401, "Authentication token is required")
    );
  }

  try {
    // Verify the token and save the user information
    const payload = verifyToken(token);

    req.user = {
      userId: Number(payload.sub),
      role: payload.role
    };

    return next();
  } catch (error) {
    // Return the correct message for an expired or invalid token
    return next(
      new AppError(
        401,
        error.name === "TokenExpiredError"
          ? "Authentication token has expired"
          : "Authentication token is invalid"
      )
    );
  }
}

module.exports = authenticateToken;
