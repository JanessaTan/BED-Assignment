const { Joi, email, fullName, phone, password } = require("./commonSchemas");

const register = Joi.object({
  fullName: fullName.required(),
  email: email.required(),
  phone,
  password: password.required()
});

const login = Joi.object({
  email: email.required(),
  password: Joi.string().min(1).max(200).required()
});

module.exports = { register, login };
