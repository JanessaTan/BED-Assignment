const model = require("../models/cuisineModel");
const { success, created } = require("../utils/responseUtils");
const AppError = require("../utils/AppError");
// Retrieve all cuisines
async function list(req, res) {
  const cuisines = await model.list();
  return success(res, 200, "Cuisines retrieved", cuisines);
}
// Retrieve one cuisine by ID
async function getOne(req, res) {
  const cuisine = await model.findById(req.params.cuisineId);
  if (!cuisine) {
    throw new AppError(404, "Cuisine was not found");
  }
  return success(res, 200, "Cuisine retrieved", cuisine);
}
// Create a new cuisine
async function create(req, res) {
  const cuisine = await model.create(req.body);
  return created(res, "Cuisine created", cuisine);
}
// Update an existing cuisine
async function update(req, res) {
  const cuisineId = req.params.cuisineId;
  const existingCuisine = await model.findById(cuisineId);
  if (!existingCuisine) {
    throw new AppError(404, "Cuisine was not found");
  }
  const updatedCuisine = await model.update(cuisineId, req.body);
  return success(res, 200, "Cuisine updated", updatedCuisine);
}
// Delete a cuisine
async function remove(req, res) {
  const deleted = await model.remove(req.params.cuisineId);
  if (!deleted) {
    throw new AppError(404, "Cuisine was not found");
  }
  return success(res, 200, "Cuisine deleted", null);
}
module.exports = {
  list,
  getOne,
  create,
  update,
  remove
};