const model = require("../models/menuItemModel");
const stallModel = require("../models/stallModel");
const { ROLES } = require("../config/constants");
const { success, created } = require("../utils/responseUtils");
const AppError = require("../utils/AppError");
// Retrieve all menu items
async function list(req, res) {
  const result = await model.list(req.query);
  return success(res, 200, "Menu items retrieved", result.rows, {
    page: result.page,
    limit: result.limit,
    total: result.total
  });
}
// Retrieve one menu item
async function getOne(req, res) {
  const menuItem = await model.findById(req.params.menuItemId);
  if (!menuItem) {
    throw new AppError(404, "Menu item was not found");
  }
  return success(res, 200, "Menu item retrieved", menuItem);
}
// Check whether the user can manage the stall
async function owner(req, stallId) {
  const isAdministrator = req.user.role === ROLES.ADMINISTRATOR;
  const ownsStall = await stallModel.vendorOwns(req.user.userId, stallId);
  if (!isAdministrator && !ownsStall) {
    throw new AppError(
      403,
      "You can manage menu items only for your own stall"
    );
  }
}
// Create a menu item
async function create(req, res) {
  await owner(req, req.body.stallId);
  const menuItem = await model.create(req.body);
  return created(res, "Menu item created", menuItem);
}
// Update a menu item
async function update(req, res) {
  const menuItemId = req.params.menuItemId;
  const existingMenuItem = await model.findById(menuItemId);
  if (!existingMenuItem) {
    throw new AppError(404, "Menu item was not found");
  }
  await owner(req, existingMenuItem.stallId);
  await owner(req, req.body.stallId);
  const updatedMenuItem = await model.update(menuItemId, req.body);
  return success(res, 200, "Menu item updated", updatedMenuItem);
}
// Make a menu item unavailable
async function remove(req, res) {
  const menuItemId = req.params.menuItemId;
  const existingMenuItem = await model.findById(menuItemId);
  if (!existingMenuItem) {
    throw new AppError(404, "Menu item was not found");
  }
  await owner(req, existingMenuItem.stallId);
  await model.remove(menuItemId);
  return success(res, 200, "Menu item made unavailable", null);
}
module.exports = {
  list,
  getOne,
  create,
  update,
  remove
};