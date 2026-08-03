const jwt = require("jsonwebtoken");

// Get and validate the JWT secret
function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    const error = new Error(
      "JWT_SECRET must contain at least 32 characters."
    );

    error.statusCode = 500;

    throw error;
  }

  return secret;
}

// Create an authentication token for a user
function createToken(user) {
  return jwt.sign(
    {
      sub: String(user.userId),
      role: user.roleName,
      stallId: user.stallId
    },
    getSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
      issuer: "hawkerhub-api",
      audience: "hawkerhub-frontend"
    }
  );
}

// Verify and decode an authentication token
function verifyToken(token) {
  return jwt.verify(
    token,
    getSecret(),
    {
      issuer: "hawkerhub-api",
      audience: "hawkerhub-frontend"
    }
  );
}

module.exports = {
  createToken,
  verifyToken
};
