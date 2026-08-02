const userModel = require("../models/userModel");
const { hashPassword } = require("../utils/passwordUtils");
const { success, created } = require("../utils/responseUtils");
const AppError = require("../utils/AppError");
const { ROLES } = require("../config/constants");
// Create a user account
async function create(req, res) {
  const passwordHash = await hashPassword(req.body.password);
  const user = await userModel.create({
    ...req.body,
    passwordHash
  });
  return created(res, "User account created", user);
}
// Retrieve all users
async function list(req, res) {
  const result = await userModel.list(req.query);
  return success(res, 200, "Users retrieved", result.rows, {
    page: result.page,
    limit: result.limit,
    total: result.total
  });
}
// Retrieve one user
async function getOne(req, res) {
  const user = await userModel.findById(req.params.userId);
  if (!user) {
    throw new AppError(404, "User account was not found");
  }
  return success(res, 200, "User retrieved", user);
}
// Retrieve the authenticated user
async function getMe(req, res) {
  req.params.userId = req.user.userId;
  return getOne(req, res);
}
// Update a user account
async function update(req, res) {
  const userId = Number(req.params.userId);
  const isAdmin = req.user.role === ROLES.ADMINISTRATOR;
  if (!isAdmin && req.user.userId !== userId) {
    throw new AppError(403, "You can only update your own profile");
  }
  if (!isAdmin && req.body.role) {
    throw new AppError(403, "Users cannot change their own role");
  }
  const user = await userModel.update(req.params.userId, req.body, isAdmin);
  if (!user) {
    throw new AppError(404, "User account was not found");
  }
  return success(res, 200, "User account updated", user);
}
// Update a user's account status
async function updateStatus(req, res) {
  const userId = Number(req.params.userId);
  if (
    req.user.userId === userId &&
    req.body.status !== "Deactivated"
  ) {
    throw new AppError(
      409,
      "Administrators cannot suspend their current session account"
    );
  }
  const affected = await userModel.updateStatus(
    req.params.userId,
    req.body.status
  );
  if (!affected) {
    throw new AppError(404, "User account was not found");
  }
  const user = await userModel.findById(req.params.userId);
  return success(res, 200, "Account status updated", user);
}
// Deactivate a user account
async function remove(req, res) {
  const userId = Number(req.params.userId);
  const isAdmin = req.user.role === ROLES.ADMINISTRATOR;
  if (!isAdmin && req.user.userId !== userId) {
    throw new AppError(
      403,
      "You can only deactivate your own account"
    );
  }
  const affected = await userModel.remove(req.params.userId);
  if (!affected) {
    throw new AppError(404, "User account was not found");
  }
  return success(res, 200, "User account deactivated", null);
}
module.exports = {
  create,
  list,
  getOne,
  getMe,
  update,
  updateStatus,
  remove
};