const { Joi } = require("./commonSchemas");

const discountType = Joi.string().valid("PERCENT", "FIXED");

const create = Joi.object({
  promotionName: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow("", null),
  stallId: Joi.string().trim().max(4).required(),
  itemId: Joi.number().integer().positive().allow(null),
  discountType: discountType.required(),
  discountValue: Joi.number().precision(2).greater(0).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required()
});

const update = Joi.object({
  promotionName: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow("", null),
  itemId: Joi.number().integer().positive().allow(null),
  discountType,
  discountValue: Joi.number().precision(2).greater(0),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  isActive: Joi.boolean()
}).min(1);

const listQuery = Joi.object({
  stallId: Joi.string().trim().max(4),
  itemId: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12)
});

const promotionParams = Joi.object({
  promotionId: Joi.number().integer().positive().required()
});

module.exports = { create, update, listQuery, promotionParams };
