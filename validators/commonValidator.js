const {
  body,
  param,
  query,
  validationResult
} = require("express-validator");

const AppError = require("../utils/AppError");

// Return validation errors in a standard format
function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) return next();

  const errors = result
    .array({ onlyFirstError: true })
    .map((error) => ({
      field: error.path,
      message: error.msg
    }));

  return next(
    new AppError(
      400,
      "Validation failed",
      errors
    )
  );
}

// Validate a positive route parameter ID
const positiveId = (name) =>
  param(name)
    .isInt({ min: 1 })
    .withMessage(`${name} must be a positive integer`)
    .toInt();

// Validate an optional positive query ID
const optionalPositiveIdQuery = (name) =>
  query(name)
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage(`${name} must be a positive integer`)
    .toInt();

// Validate pagination values
const pagination = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be from 1 to 100")
    .toInt()
];

module.exports = {
  body,
  param,
  query,
  validateRequest,
  positiveId,
  optionalPositiveIdQuery,
  pagination
};
