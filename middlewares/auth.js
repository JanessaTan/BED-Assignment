const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
  try {
    const header = req.get("authorization");
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication is required");
    }

    const token = header.slice(7).trim();
    if (!token) throw new AppError(401, "Authentication is required");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      const message =
        error.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Invalid authentication token";
      throw new AppError(401, message);
    }

    const user = await userModel.findActiveIdentityById(payload.userId);
    if (!user) {
      throw new AppError(401, "This account is unavailable or deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function authorize(...allowedRoles) {
  return function authorizeRole(req, res, next) {
    if (!req.user) return next(new AppError(401, "Authentication is required"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(403, "You do not have permission to perform this action")
      );
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  verifyJWT: authenticate
};
