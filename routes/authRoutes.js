const express = require("express"),
  controller = require("../controllers/authController"),
  validator = require("../validators/authValidator"),
  asyncHandler = require("../utils/asyncHandler"),
  authenticate = require("../middlewares/authenticateToken");

// Create the authentication router
const router = express.Router();

// Register a new account
router.post(
  "/register",
  validator.register,
  asyncHandler(controller.register)
);

// Log in to an account
router.post(
  "/login",
  validator.login,
  asyncHandler(controller.login)
);

// Get the authenticated user's information
router.get(
  "/me",
  authenticate,
  asyncHandler(controller.me)
);

// Log out from the account
router.post(
  "/logout",
  authenticate,
  asyncHandler(controller.logout)
);

module.exports = router;
