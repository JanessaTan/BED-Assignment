const stallModel = require("../models/stallModel");
const { ROLES } = require("../config/constants");
const { success, created } = require("../utils/responseUtils");
const AppError = require("../utils/AppError");
// Retrieve all stalls
async function list(req, res) {
  const result = await stallModel.list(req.query);
  return success(res, 200, "Stalls retrieved", result.rows, {
    page: result.page,
    limit: result.limit,
    total: result.total
  });
}
// Retrieve stalls owned by the signed-in vendor
async function mine(req, res) {
  const result = await stallModel.list({
    ...req.query,
    vendorId: req.user.userId,
    limit: req.query.limit || 100
  });
  return success(res, 200, "Owned stalls retrieved", result.rows, {
    page: result.page,
    limit: result.limit,
    total: result.total
  });
}
// Retrieve one stall
async function getOne(req, res) {
  const stall = await stallModel.findById(req.params.stallId);
  if (!stall) {
    throw new AppError(404, "Stall was not found");
  }
  return success(res, 200, "Stall retrieved", stall);
}
// Check whether the user can manage the stall
async function ensureOwner(req, stallId) {
  if (req.user.role === ROLES.ADMINISTRATOR) {
    return;
  }
  const ownsStall = await stallModel.vendorOwns(req.user.userId, stallId);
  if (!ownsStall) {
    throw new AppError(403, "You can manage only your own stall");
  }
}
// Create a stall
async function create(req, res) {
  const isAdministrator = req.user.role === ROLES.ADMINISTRATOR;
  if (isAdministrator && !req.body.vendorId) {
    throw new AppError(
      400,
      "Administrators must select the Vendor who will own the stall"
    );
  }
  const vendorId = isAdministrator
    ? req.body.vendorId
    : req.user.userId;
  const stall = await stallModel.create(req.body, vendorId);
  return created(res, "Stall created", stall);
}
// Update a stall
async function update(req, res) {
  const stallId = req.params.stallId;
  const existingStall = await stallModel.findById(stallId);
  if (!existingStall) {
    throw new AppError(404, "Stall was not found");
  }
  await ensureOwner(req, stallId);
  const updatedStall = await stallModel.update(stallId, req.body);
  return success(res, 200, "Stall updated", updatedStall);
}
// Deactivate a stall
async function remove(req, res) {
  const stallId = req.params.stallId;
  const existingStall = await stallModel.findById(stallId);
  if (!existingStall) {
    throw new AppError(404, "Stall was not found");
  }
  await ensureOwner(req, stallId);
  const removed = await stallModel.remove(stallId);
  if (!removed) {
    throw new AppError(404, "Stall was not found");
  }
  return success(res, 200, "Stall deactivated", null);
}
module.exports = {
  list,
  mine,
  getOne,
  create,
  update,
  remove
};
