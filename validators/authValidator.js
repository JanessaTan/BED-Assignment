const {
  body,
  validateRequest
} = require("./commonValidator");

const {
  PUBLIC_REGISTRATION_ROLES
} = require("../config/constants");

// Validate the password requirements
const passwordRule = body("password")
  .isLength({ min: 8, max: 72 })
  .withMessage("Password must contain 8 to 72 characters")
  .matches(/[A-Za-z]/)
  .withMessage("Password must contain a letter")
  .matches(/\d/)
  .withMessage("Password must contain a number");

// Validate account registration
const register = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must contain 2 to 120 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  passwordRule,

  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),

  body("role")
    .isIn(PUBLIC_REGISTRATION_ROLES)
    .withMessage(
      "Public registration is available only for Customer or Vendor"
    ),

  body("termsAccepted")
    .equals("true")
    .withMessage("The terms must be accepted")
    .toBoolean(),

  validateRequest
];

// Validate account login
const login = [
  body("identifier")
    .trim()
    .isLength({ min: 2, max: 254 })
    .withMessage("Email or username is required"),

  body("password")
    .isLength({ min: 1, max: 72 })
    .withMessage("Password is required"),

  body("role")
    .optional()
    .isString()
    .trim(),

  validateRequest
];

module.exports = {
  register,
  login
};
