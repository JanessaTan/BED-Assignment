const Joi = require("joi");

const email = Joi.string().trim().lowercase().email().max(254);
const fullName = Joi.string().trim().min(2).max(100);
const phone = Joi.string()
  .trim()
  .pattern(/^\+?[0-9][0-9 -]{6,18}[0-9]$/)
  .allow("", null);
const password = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[a-z]/, "lowercase letter")
  .pattern(/[A-Z]/, "uppercase letter")
  .pattern(/[0-9]/, "number")
  .pattern(/[^A-Za-z0-9]/, "special character");

module.exports = { Joi, email, fullName, phone, password };
