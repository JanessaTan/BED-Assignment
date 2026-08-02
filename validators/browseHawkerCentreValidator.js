const {
  body,
  query,
  validateRequest,
  positiveId,
  pagination
} = require("./commonValidator");

// Validate hawker centre list filters
const list = [
  ...pagination,

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search can contain at most 100 characters"),

  query("town")
    .optional()
    .trim()
    .isLength({ max: 80 }),

  query("crowdLevel")
    .optional()
    .isIn(["Low", "Moderate", "High", "Very High"]),

  validateRequest
];

// Validate a location search
const locationSearch = [
  query("q")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Location search must contain 2 to 100 characters"),

  validateRequest
];

// Validate hawker centre information
const create = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 150 }),

  body("town")
    .trim()
    .isLength({ min: 2, max: 80 }),

  body("address")
    .trim()
    .isLength({ min: 5, max: 250 }),

  body("nearestMrt")
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body("openingHours")
    .optional()
    .trim()
    .isLength({ max: 120 }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }),

  validateRequest
];

module.exports = {
  list,
  locationSearch,
  create,
  update: [
    positiveId("centreId"),
    ...create
  ],
  id: [
    positiveId("centreId"),
    validateRequest
  ]
};
