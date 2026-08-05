const userModel = require("../models/userModel");

const {
  hashPassword,
  comparePassword
} = require("../utils/passwordUtils");

const { createToken } = require("../utils/tokenUtils");

const {
  created,
  success
} = require("../utils/responseUtils");

const AppError = require("../utils/AppError");

// Create the login response data
function authPayload(user) {
  return {
    token: createToken(user),
    user
  };
}

// Register a new user account
async function register(req, res) {
  const existingUser = await userModel.findByIdentifier(req.body.email);

  if (
    existingUser &&
    existingUser.email.toLowerCase() === req.body.email.toLowerCase()
  ) {
    throw new AppError(
      409,
      "An account with this email already exists",
      [
        {
          field: "email",
          message: "Email is already registered"
        }
      ]
    );
  }

  const passwordHash = await hashPassword(req.body.password);

  const user = await userModel.create({
    ...req.body,
    passwordHash
  });

  return created(
    res,
    "Account created successfully",
    authPayload(user)
  );
}

// Log in an existing user
async function login(req, res) {
  const identifier = String(req.body.identifier || "")
    .trim()
    .toLowerCase();

  const user = await userModel.findByIdentifier(identifier);

  const passwordMatches = user
    ? await comparePassword(req.body.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw new AppError(
      401,
      "Invalid email or password"
    );
  }

  if (user.accountStatus !== "Active") {
    throw new AppError(
      403,
      "This account is not active"
    );
  }

  const {
    passwordHash,
    ...safeUser
  } = user;

  return success(
    res,
    200,
    "Login successful",
    authPayload(safeUser)
  );
}

// Retrieve the authenticated user's account
async function me(req, res) {
  const user = await userModel.findById(req.user.userId);

  if (!user) {
    throw new AppError(
      404,
      "User account was not found"
    );
  }

  return success(
    res,
    200,
    "Authenticated user retrieved",
    user
  );
}

// Log out the current user
async function logout(req, res) {
  return success(
    res,
    200,
    "Logout successful. Remove the token from browser storage.",
    null
  );
}

module.exports = {
  register,
  login,
  me,
  logout
};