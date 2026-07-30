const { Joi, email, fullName, phone, password } = require("./commonSchemas");

const roles = [
  "customer",
  "vendor",
  "operator",
  "nea_officer",
  "administrator"
];

const adminCreate = Joi.object({
  fullName: fullName.required(),
  email: email.required(),
  phone,
  password: password.required(),
  role: Joi.string()
    .valid(...roles)
    .required(),
  profileId: Joi.string().trim().max(10).allow(null, "")
});

const updateMe = Joi.object({
  fullName,
  email,
  phone,
  currentPassword: Joi.string().max(200),
  newPassword: password
})
  .min(1)
  .with("newPassword", "currentPassword");

const adminUpdate = Joi.object({
  fullName,
  email,
  phone,
  role: Joi.string().valid(...roles),
  isActive: Joi.boolean(),
  newPassword: password
}).min(1);

const listQuery = Joi.object({
  search: Joi.string().trim().max(100).allow(""),
  role: Joi.string().valid(...roles),
  status: Joi.string().valid("active", "inactive"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const userParams = Joi.object({
  userId: Joi.number().integer().positive().required()
});

module.exports = {
  adminCreate,
  updateMe,
  adminUpdate,
  listQuery,
  userParams,
  roles
};
