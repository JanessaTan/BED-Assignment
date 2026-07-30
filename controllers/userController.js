const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const AppError = require("../utils/AppError");

async function createUser(req, res) {
  if (await userModel.emailExists(req.body.email)) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await userModel.createUser({
    ...req.body,
    passwordHash
  });

  res.status(201).json({
    success: true,
    message: "User account created successfully",
    data: user
  });
}

async function listUsers(req, res) {
  const result = await userModel.listUsers(req.query);
  res.json({
    success: true,
    message: "Users retrieved successfully",
    data: result.users,
    pagination: result.pagination
  });
}

async function getMe(req, res) {
  const user = await userModel.findById(req.user.userId);
  res.json({
    success: true,
    message: "Profile retrieved successfully",
    data: user
  });
}

async function getUser(req, res) {
  const userId = Number(req.params.userId);
  if (req.user.role !== "administrator" && req.user.userId !== userId) {
    throw new AppError(403, "You may retrieve only your own profile");
  }

  const user = await userModel.findById(userId);
  if (!user) throw new AppError(404, "User account not found");

  res.json({
    success: true,
    message: "User retrieved successfully",
    data: user
  });
}

async function updateMe(req, res) {
  if (
    req.body.email &&
    (await userModel.emailExists(req.body.email, req.user.userId))
  ) {
    throw new AppError(409, "An account with this email already exists");
  }

  const changes = {
    ...(req.body.fullName !== undefined && { fullName: req.body.fullName }),
    ...(req.body.email !== undefined && { email: req.body.email }),
    ...(req.body.phone !== undefined && { phone: req.body.phone || null })
  };

  if (req.body.newPassword) {
    const currentHash = await userModel.getPasswordHash(req.user.userId);
    const matches = await bcrypt.compare(req.body.currentPassword, currentHash);
    if (!matches) throw new AppError(400, "Current password is incorrect");
    changes.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  }

  const user = await userModel.updateUser(req.user.userId, changes);
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: user
  });
}

async function updateUser(req, res) {
  const userId = Number(req.params.userId);
  const existing = await userModel.findById(userId);
  if (!existing) throw new AppError(404, "User account not found");

  if (
    req.body.email &&
    (await userModel.emailExists(req.body.email, userId))
  ) {
    throw new AppError(409, "An account with this email already exists");
  }

  const changes = { ...req.body };
  if (changes.newPassword) {
    changes.passwordHash = await bcrypt.hash(changes.newPassword, 12);
    delete changes.newPassword;
  }

  const user = await userModel.updateUser(userId, changes);
  res.json({
    success: true,
    message: "User account updated successfully",
    data: user
  });
}

async function deactivateUser(req, res) {
  const userId = Number(req.params.userId);
  if (userId === req.user.userId) {
    throw new AppError(
      400,
      "Administrators cannot deactivate their own active session"
    );
  }

  const existing = await userModel.findById(userId);
  if (!existing) throw new AppError(404, "User account not found");

  const user = await userModel.updateUser(userId, { isActive: false });
  res.json({
    success: true,
    message: "User account deactivated successfully",
    data: user
  });
}

module.exports = {
  createUser,
  listUsers,
  getMe,
  getUser,
  updateMe,
  updateUser,
  deactivateUser
};
