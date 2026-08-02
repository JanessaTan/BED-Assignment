const model = require("../models/promotionModel");
const stallModel = require("../models/stallModel");
const { ROLES } = require("../config/constants");
const { success, created } = require("../utils/responseUtils");
const AppError = require("../utils/AppError");
// Retrieve all promotions
async function list(req, res) {
  const result = await model.list(req.query);
  return success(res, 200, "Promotions retrieved", result.rows, {
    page: result.page,
    limit: result.limit,
    total: result.total
  });
}
// Retrieve one promotion
async function getOne(req, res) {
  const promotion = await model.findById(req.params.promotionId);
  if (!promotion) {
    throw new AppError(404, "Promotion was not found");
  }
  return success(res, 200, "Promotion retrieved", promotion);
}
// Check whether the user can manage the stall
async function owner(req, stallId) {
  const isAdministrator = req.user.role === ROLES.ADMINISTRATOR;
  if (!isAdministrator) {
    const ownsStall = await stallModel.vendorOwns(req.user.userId, stallId);
    if (!ownsStall) {
      throw new AppError(
        403,
        "You can manage promotions only for your own stall"
      );
    }
  }
}
// Create a promotion
async function create(req, res) {
  await owner(req, req.body.stallId);
  const promotion = await model.create(req.body);
  return created(res, "Promotion created", promotion);
}
// Update a promotion
async function update(req, res) {
  const promotionId = req.params.promotionId;
  const existingPromotion = await model.findById(promotionId);
  if (!existingPromotion) {
    throw new AppError(404, "Promotion was not found");
  }
  await owner(req, existingPromotion.stallId);
  await owner(req, req.body.stallId);
  const updatedPromotion = await model.update(promotionId, req.body);
  return success(res, 200, "Promotion updated", updatedPromotion);
}
// Deactivate a promotion
async function remove(req, res) {
  const promotionId = req.params.promotionId;
  const existingPromotion = await model.findById(promotionId);
  if (!existingPromotion) {
    throw new AppError(404, "Promotion was not found");
  }
  await owner(req, existingPromotion.stallId);
  await model.remove(promotionId);
  return success(res, 200, "Promotion deactivated", null);
}
module.exports = {
  list,
  getOne,
  create,
  update,
  remove
};