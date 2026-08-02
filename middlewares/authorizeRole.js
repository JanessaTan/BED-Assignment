const AppError = require("../utils/AppError");
// Check whether the user has an allowed role
module.exports = function authorizeRole(...allowedRoles) {
  return function roleAuthorizer(req, res, next) {
    if (!req.user) {
      return next(
        new AppError(401, "Authentication is required")
      );
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "Your account role is not allowed to perform this action"
        )
      );
    }
    return next();
  };
};