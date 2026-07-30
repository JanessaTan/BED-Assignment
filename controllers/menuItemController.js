const menuItemModel = require("../models/menuItemModel");
const promotionService = require("../services/promotionService");
const AppError = require("../utils/AppError");

async function listMenuItems(req, res) {
  const result = await menuItemModel.list(req.query, { publicOnly: true });
  const items = await promotionService.attachBestDiscounts(result.items);
  res.json({
    success: true,
    message: "Menu items retrieved successfully",
    data: items,
    pagination: result.pagination
  });
}

async function getMenuItem(req, res) {
  const item = await menuItemModel.findById(Number(req.params.itemId));
  if (!item) throw new AppError(404, "Menu item not found");
  const [discounted] = await promotionService.attachBestDiscounts([item]);
  res.json({
    success: true,
    message: "Menu item retrieved successfully",
    data: discounted
  });
}

function requireLinkedVendor(req) {
  if (!req.user.ownerId) {
    throw new AppError(
      403,
      "This vendor account is not linked to a stall-owner profile"
    );
  }
}

async function listOwnedStalls(req, res) {
  requireLinkedVendor(req);
  const stalls = await menuItemModel.getOwnedStalls(req.user.ownerId);
  res.json({
    success: true,
    message: "Owned stalls retrieved successfully",
    data: stalls
  });
}

async function listMyMenuItems(req, res) {
  requireLinkedVendor(req);
  const result = await menuItemModel.list(
    { ...req.query, ownerId: req.user.ownerId },
    { publicOnly: false }
  );
  res.json({
    success: true,
    message: "Vendor menu items retrieved successfully",
    data: result.items,
    pagination: result.pagination
  });
}

async function createMenuItem(req, res) {
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
      "You cannot create a menu item for another vendor's stall"
    );
  }

  const item = await menuItemModel.create(req.body);
  res.status(201).json({
    success: true,
    message: "Menu item created successfully",
    data: item
  });
}

async function updateMenuItem(req, res) {
  requireLinkedVendor(req);
  const itemId = Number(req.params.itemId);
  const existing = await menuItemModel.findById(itemId, true);
  if (!existing) throw new AppError(404, "Menu item not found");
  if (!existing.isActive) {
    throw new AppError(400, "A deactivated menu item cannot be edited");
  }
  if (
    !(await menuItemModel.isStallOwnedBy(
      existing.stallId,
      req.user.ownerId
    ))
  ) {
    throw new AppError(
      403,
      "You cannot update another vendor's menu item"
    );
  }

  const item = await menuItemModel.update(itemId, req.body);
  res.json({
    success: true,
    message: "Menu item updated successfully",
    data: item
  });
}

async function deleteMenuItem(req, res) {
  requireLinkedVendor(req);
  const itemId = Number(req.params.itemId);
  const existing = await menuItemModel.findById(itemId, true);
  if (!existing) throw new AppError(404, "Menu item not found");
  if (
    !(await menuItemModel.isStallOwnedBy(
      existing.stallId,
      req.user.ownerId
    ))
  ) {
    throw new AppError(
      403,
      "You cannot deactivate another vendor's menu item"
    );
  }

  await menuItemModel.deactivate(itemId);
  res.json({
    success: true,
    message: "Menu item deactivated successfully",
    data: { itemId }
  });
}

module.exports = {
  listMenuItems,
  getMenuItem,
  listOwnedStalls,
  listMyMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
