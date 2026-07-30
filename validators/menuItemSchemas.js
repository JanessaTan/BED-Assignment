const { Joi } = require("./commonSchemas");

const categories = ["Main", "Side", "Drink", "Dessert", "Set", "Add-on"];
const imageUrl = Joi.string()
  .trim()
  .uri({ scheme: ["http", "https"] })
  .max(500)
  .allow("", null);

const create = Joi.object({
  stallId: Joi.string().trim().max(4).required(),
  itemName: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow("", null),
  price: Joi.number().precision(2).greater(0).max(99999999.99).required(),
  category: Joi.string()
    .valid(...categories)
    .required(),
  imageUrl,
  isAvailable: Joi.boolean().default(true),
  isVegetarian: Joi.boolean().default(false),
  dietaryInfo: Joi.string().trim().max(200).allow("", null),
  cuisineIds: Joi.array()
    .items(Joi.string().trim().max(10))
    .min(1)
    .unique()
    .required()
});

const update = Joi.object({
  itemName: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow("", null),
  price: Joi.number().precision(2).greater(0).max(99999999.99),
  category: Joi.string().valid(...categories),
  imageUrl,
  isAvailable: Joi.boolean(),
  isVegetarian: Joi.boolean(),
  dietaryInfo: Joi.string().trim().max(200).allow("", null),
  cuisineIds: Joi.array()
    .items(Joi.string().trim().max(10))
    .min(1)
    .unique()
}).min(1);

const listQuery = Joi.object({
  search: Joi.string().trim().max(100).allow(""),
  stallId: Joi.string().trim().max(4),
  category: Joi.string().valid(...categories),
  cuisineId: Joi.string().trim().max(10),
  availability: Joi.string().valid("available", "unavailable", "all"),
  sortBy: Joi.string().valid("name", "price").default("name"),
  sortDir: Joi.string().lowercase().valid("asc", "desc").default("asc"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12)
});

const itemParams = Joi.object({
  itemId: Joi.number().integer().positive().required()
});

module.exports = { create, update, listQuery, itemParams, categories };
