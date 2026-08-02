const {
  body,
  query,
  validateRequest,
  positiveId,
  optionalPositiveIdQuery,
  pagination
} = require("./commonValidator");

// Validate menu item information
const fields = [
  body("stallId")
    .isInt({ min: 1 })
    .withMessage("Select a stall")
    .toInt(),

  body("name")
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Name must contain 2 to 150 characters"),

  body("category")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Category is required"),

  body("description")
    .trim()
    .isLength({ min: 5, max: 600 })
    .withMessage("Description must contain 5 to 600 characters"),

  body("price")
    .isFloat({ gt: 0, max: 10000 })
    .withMessage("Price must be greater than zero")
    .toFloat(),

  body("preparationMinutes")
    .isInt({ min: 1, max: 240 })
    .withMessage("Preparation time must be 1 to 240 minutes")
    .toInt(),

  body("isAvailable")
    .isBoolean()
    .withMessage("Availability must be true or false")
    .toBoolean(),

  body("cuisineIds")
    .isArray({ min: 1, max: 20 })
    .withMessage("Select at least one cuisine"),

  body("cuisineIds.*")
    .isInt({ min: 1 })
    .withMessage("Cuisine IDs must be positive integers")
    .toInt(),

  body("addOns")
    .optional()
    .isArray({ max: 20 }),

  body("addOns.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),

  body("addOns.*.price")
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .toFloat()
];

// Validate menu item list filters
const list = [
  ...pagination,
  optionalPositiveIdQuery("stallId"),
  optionalPositiveIdQuery("cuisineId"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  query("category")
    .optional()
    .trim()
    .isLength({ max: 60 }),

  query("available")
    .optional()
    .isBoolean()
    .toBoolean(),

  query("sort")
    .optional()
    .isIn([
      "recommended",
      "price_asc",
      "price_desc",
      "name"
    ]),

  validateRequest
];

module.exports = {
  create: [
    ...fields,
    validateRequest
  ],
  update: [
    positiveId("menuItemId"),
    ...fields,
    validateRequest
  ],
  list,
  id: [
    positiveId("menuItemId"),
    validateRequest
  ]
};
