const promotionModel = require("../models/promotionModel");
const menuItemModel = require("../models/menuItemModel");
const promotionService = require("../services/promotionService");
const AppError = require("../utils/AppError");

function requireLinkedVendor(req) {
  if (!req.user.ownerId) {
    throw new AppError(
      403,
      "This vendor account is not linked to a stall-owner profile"
    );
  }
}

function validatePromotionRules(data) {
  if (new Date(data.startDate) > new Date(data.endDate)) {
    throw new AppError(400, "Start date cannot be after end date");
  }
  if (
    data.discountType === "PERCENT" &&
    (data.discountValue <= 0 || data.discountValue > 100)
  ) {
    throw new AppError(
      400,
      "Percentage discount must be above 0 and no more than 100"
    );
  }
  if (data.discountType === "FIXED" && data.discountValue <= 0) {
    throw new AppError(400, "Fixed discount must be above 0");
  }
}

async function resolveItem(stallId, itemId) {
  if (!itemId) return null;
  const item = await menuItemModel.findById(itemId, true);
  if (!item || !item.isActive) {
    throw new AppError(400, "The selected menu item does not exist");
  }
  if (item.stallId !== stallId) {
    throw new AppError(400, "The selected menu item belongs to another stall");
  }
  return item;
}

async function listActivePromotions(req, res) {
  const result = await promotionModel.listActive(req.query);
  res.json({
    success: true,
    message: "Active promotions retrieved successfully",
    data: result.promotions.map(promotionService.enrichPromotion),
    pagination: result.pagination
  });
}

async function getPromotion(req, res) {
  const promotion = await promotionModel.findById(
    Number(req.params.promotionId),
    true
  );
  if (!promotion) throw new AppError(404, "Active promotion not found");
  res.json({
    success: true,
    message: "Promotion retrieved successfully",
    data: promotionService.enrichPromotion(promotion)
  });
}

async function listMyPromotions(req, res) {
  requireLinkedVendor(req);
  const result = await promotionModel.listMine(req.user.ownerId, req.query);
  res.json({
    success: true,
    message: "Vendor promotions retrieved successfully",
    data: result.promotions.map(promotionService.enrichPromotion),
    pagination: result.pagination
  });
}

async function createPromotion(req, res) {
  requireLinkedVendor(req);
  if (!(await menuItemModel.stallExists(req.body.stallId))) {
    throw new AppError(400, "The selected stall does not exist");
  }
  if (
    !(await menuItemModel.isStallOwnedBy(
      req.body.stallId,
      req.user.ownerId
    ))
  ) {
    throw new AppError(
      403,
      "You cannot create a promotion for another vendor's stall"
    );
  }

  const item = await resolveItem(req.body.stallId, req.body.itemId);
  validatePromotionRules(req.body);
  const promotion = await promotionModel.create({
    ...req.body,
    itemCode: item?.itemCode || null
  });

  res.status(201).json({
    success: true,
    message: "Promotion created successfully",
    data: promotionService.enrichPromotion(promotion)
  });
}

async function updatePromotion(req, res) {
  requireLinkedVendor(req);
  const promotionId = Number(req.params.promotionId);
  const existing = await promotionModel.findById(promotionId);
  if (!existing) throw new AppError(404, "Promotion not found");
  if (
    !(await menuItemModel.isStallOwnedBy(
      existing.stallId,
      req.user.ownerId
    ))
  ) {
    throw new AppError(
      403,
      "You cannot update another vendor's promotion"
    );
  }

  const merged = {
    promotionName: req.body.promotionName ?? existing.promotionName,
    description:
      req.body.description !== undefined
        ? req.body.description
        : existing.description,
    startDate: req.body.startDate ?? existing.startDate,
    endDate: req.body.endDate ?? existing.endDate,
    discountType: req.body.discountType ?? existing.discountType,
    discountValue: req.body.discountValue ?? existing.discountValue,
    isActive: req.body.isActive ?? existing.isActive
  };
  validatePromotionRules(merged);

  let itemCode = existing.itemCode;
  if (Object.prototype.hasOwnProperty.call(req.body, "itemId")) {
    const item = await resolveItem(existing.stallId, req.body.itemId);
    itemCode = item?.itemCode || null;
  }

  const promotion = await promotionModel.update(promotionId, {
    ...merged,
    itemCode
  });
  res.json({
    success: true,
    message: "Promotion updated successfully",
    data: promotionService.enrichPromotion(promotion)
  });
}

async function deletePromotion(req, res) {
  requireLinkedVendor(req);
  const promotionId = Number(req.params.promotionId);
  const existing = await promotionModel.findById(promotionId);
  if (!existing) throw new AppError(404, "Promotion not found");
  if (
    !(await menuItemModel.isStallOwnedBy(
      existing.stallId,
      req.user.ownerId
    ))
  ) {
    throw new AppError(
      403,
      "You cannot deactivate another vendor's promotion"
    );
  }

  await promotionModel.deactivate(promotionId);
  res.json({
    success: true,
    message: "Promotion deactivated successfully",
    data: { promotionId }
  });
}

module.exports = {
  listActivePromotions,
  listAllActivePromotions: listActivePromotions,
  getPromotion,
  listMyPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
};
