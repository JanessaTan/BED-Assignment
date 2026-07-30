const AppError = require("../utils/AppError");

module.exports = function validate(schema, property = "body") {
  return function validateRequest(req, res, next) {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false
    });

    if (error) {
      return next(
        new AppError(
          400,
          "Validation failed",
          error.details.map((detail) => detail.message)
        )
      );
    }

    req[property] = value;
    next();
  };
};
