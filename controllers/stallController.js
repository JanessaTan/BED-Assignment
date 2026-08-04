const stallModel = require("../models/stallModel");
const { ROLES } = require("../config/constants");
const {
  success,
  created
} = require("../utils/responseUtils");
const AppError = require("../utils/AppError");

// Retrieve all stalls
async function list(req, res) {
  const result = await stallModel.list(req.query);

  return success(
    res,
    200,
    "Stalls retrieved",
    result.rows,
    {
      page: result.page,
      limit: result.limit,
      total: result.total
    }
  );
}

// Retrieve one stall
async function getOne(req, res) {
  const stall = await stallModel.findById(
    req.params.stallId
  );

  if (!stall) {
    throw new AppError(
      404,
      "Stall was not found"
    );
  }

  return success(
    res,
    200,
    "Stall retrieved",
    stall
  );
}

// Retrieve stalls owned by the logged-in vendor
async function getMyStalls(req, res) {
  const stalls = await stallModel.listByVendor(
    req.user.userId
  );

  return success(
    res,
    200,
    "Your stalls retrieved",
    stalls
  );
}

// Check whether the user can manage the stall
async function ensureOwner(req, stallId) {
  if (
    req.user.role === ROLES.ADMINISTRATOR
  ) {
    return;
  }

  const ownsStall =
    await stallModel.vendorOwns(
      req.user.userId,
      stallId
    );

  if (!ownsStall) {
    throw new AppError(
      403,
      "You can manage only your own stall"
    );
  }
}

// Create a stall
async function create(req, res) {
  const vendorId =
    req.user.role === ROLES.ADMINISTRATOR
      ? req.body.vendorId ||
        req.user.userId
      : req.user.userId;

  const stall = await stallModel.create(
    req.body,
    vendorId
  );

  return created(
    res,
    "Stall created",
    stall
  );
}

// Update a stall
async function update(req, res) {
  const stallId = req.params.stallId;

  await ensureOwner(req, stallId);

  const updatedStall =
    await stallModel.update(
      stallId,
      req.body
    );

  return success(
    res,
    200,
    "Stall updated",
    updatedStall
  );
}

// Deactivate a stall
async function remove(req, res) {
  const stallId = req.params.stallId;

  await ensureOwner(req, stallId);

  const removed =
    await stallModel.remove(stallId);

  if (!removed) {
    throw new AppError(
      404,
      "Stall was not found"
    );
  }

  return success(
    res,
    200,
    "Stall deactivated",
    null
  );
}

module.exports = {
  list,
  getOne,
  getMyStalls,
  create,
  update,
  remove
};