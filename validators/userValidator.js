const {
  body,
  query,
  validateRequest,
  positiveId,
  pagination
} = require("./commonValidator");

const {
  ROLES
} = require("../config/constants");

// Validate a new user account
const create = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must contain 2 to 120 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must contain 8 to 72 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter")
    .matches(/\d/)
    .withMessage("Password must contain a number"),

  body("role")
    .isIn(Object.values(ROLES))
    .withMessage("Select a valid role"),

  body("phone")
    .optional({ values: "falsy" })
    .matches(/^[689]\d{7}$/)
    .withMessage("Enter a valid 8-digit Singapore phone number"),

  validateRequest
];

// Validate user account updates
const update = [
  positiveId("userId"),

  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must contain 2 to 120 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("phone")
    .optional({ values: "falsy" })
    .matches(/^[689]\d{7}$/)
    .withMessage("Enter a valid 8-digit Singapore phone number"),

  body("role")
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage("Select a valid role"),

  validateRequest
];

// Validate an account status change
const status = [
  positiveId("userId"),

  body("status")
    .isIn(["Active", "Deactivated", "Suspended"])
    .withMessage("Select a valid account status"),

  validateRequest
];

// Validate user list filters
const list = [
  ...pagination,

  query("search")
    .optional()
    .trim()
    .isLength({ max: 120 }),

  query("role")
    .optional()
    .isIn(Object.values(ROLES)),

  validateRequest
];

module.exports = {
  create,
  update,
  status,
  list,
  id: [
    positiveId("userId"),
    validateRequest
  ]
};
