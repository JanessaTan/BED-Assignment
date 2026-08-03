const {
  body,
  query,
  validateRequest,
  positiveId,
  optionalPositiveIdQuery,
  pagination
} = require("./commonValidator");

// Validate stall information
const fields = [
  body("centreId")
    .isInt({ min: 1 })
    .withMessage("Select a hawker centre")
    .toInt(),

  body("name")
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Stall name must contain 2 to 150 characters"),

  body("unitNumber")
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Enter a valid stall unit"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }),

  body("openingHours")
    .optional()
    .trim()
    .isLength({ max: 120 }),

  body("cuisineIds")
    .optional()
    .isArray({ max: 20 })
    .withMessage("cuisineIds must be an array"),

  body("cuisineIds.*")
    .optional()
    .isInt({ min: 1 })
    .toInt()
];

// Validate stall list filters
const list = [
  ...pagination,
  optionalPositiveIdQuery("centreId"),
  optionalPositiveIdQuery("cuisineId"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  query("hygieneGrade")
    .optional()
    .isIn(["A", "B", "C", "D"]),

  validateRequest
];

module.exports = {
  create: [
    ...fields,
    validateRequest
  ],
  update: [
    positiveId("stallId"),
    ...fields,
    validateRequest
  ],
  list,
  id: [
    positiveId("stallId"),
    validateRequest
  ]
};
