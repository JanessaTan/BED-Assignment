const {
  body,
  query,
  validateRequest,
  positiveId,
  optionalPositiveIdQuery,
  pagination
} = require("./commonValidator");

// Validate promotion information
const fields = [
  body("stallId")
    .isInt({ min: 1 })
    .withMessage("Select a stall")
    .toInt(),

  body("name")
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Promotion name must contain 2 to 150 characters"),

  body("description")
    .trim()
    .isLength({ min: 5, max: 500 }),

  body("discountType")
    .isIn(["Fixed", "Percentage"])
    .withMessage("Discount type must be Fixed or Percentage"),

  body("discountValue")
    .isFloat({ gt: 0, max: 10000 })
    .withMessage("Discount must be greater than zero")
    .toFloat()
    .custom((value, { req }) =>
      req.body.discountType !== "Percentage" || value <= 100
    )
    .withMessage("Percentage discount cannot exceed 100"),

  body("startDate")
    .isISO8601({ strict: true })
    .withMessage("Enter a valid start date")
    .toDate(),

  body("endDate")
    .isISO8601({ strict: true })
    .withMessage("Enter a valid end date")
    .toDate()
    .custom(
      (value, { req }) =>
        value >= new Date(req.body.startDate)
    )
    .withMessage("End date cannot be before start date"),

  body("menuItemIds")
    .optional()
    .isArray({ max: 100 }),

  body("menuItemIds.*")
    .optional()
    .isInt({ min: 1 })
    .toInt()
];

// Validate promotion list filters
const list = [
  ...pagination,
  optionalPositiveIdQuery("centreId"),
  optionalPositiveIdQuery("stallId"),

  query("active")
    .optional()
    .isBoolean()
    .toBoolean(),

  validateRequest
];

module.exports = {
  create: [
    ...fields,
    validateRequest
  ],
  update: [
    positiveId("promotionId"),
    ...fields,
    validateRequest
  ],
  list,
  id: [
    positiveId("promotionId"),
    validateRequest
  ]
};
