const {
  body,
  validateRequest,
  positiveId
} = require("./commonValidator");

// Validate cuisine information
const fields = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Cuisine name must contain 2 to 80 characters")
];

module.exports = {
  create: [
    ...fields,
    validateRequest
  ],
  update: [
    positiveId("cuisineId"),
    ...fields,
    validateRequest
  ],
  id: [
    positiveId("cuisineId"),
    validateRequest
  ]
};
