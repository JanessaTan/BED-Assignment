const AppError = require("../utils/AppError");
const { ROLES } = require("../config/constants");

// Allow administrators or users accessing their own account
module.exports = function authorizeOwnership(parameterName = "userId") {
  return function ownershipAuthorizer(req, res, next) {
    // The user must be authenticated
    if (!req.user) {
      return next(
        new AppError(401, "Authentication is required")
      );
    }

    // Allow an administrator or the owner of the account
    if (
      req.user.role === ROLES.ADMINISTRATOR ||
      req.user.userId === Number(req.params[parameterName])
    ) {
      return next();
    }

    return next(
      new AppError(403, "You can only access your own account")
    );
  };
};
