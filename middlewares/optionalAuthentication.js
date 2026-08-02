const { verifyToken } = require("../utils/tokenUtils");

// Read the token when available, but allow requests without one
module.exports = function optionalAuthentication(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  // Try to authenticate only when a Bearer token is provided
  if (scheme === "Bearer" && token) {
    try {
      const payload = verifyToken(token);

      req.user = {
        userId: Number(payload.sub),
        role: payload.role
      };
    } catch (error) {
      // Continue as a guest when the token is invalid
      req.user = undefined;
    }
  }

  next();
};
