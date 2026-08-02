const express = require("express");
const controller = require("../controllers/userController");
const validator = require("../validators/userValidator");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const authorizeOwnership = require("../middlewares/authorizeOwnership");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");
const router = express.Router();
// Require authentication for all routes
router.use(authenticateToken);
// Retrieve the authenticated user
router.get(
  "/me",
  asyncHandler(controller.getMe)
);
// Create a user account
router.post(
  "/",
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.create,
  asyncHandler(controller.create)
);
// Retrieve all users
router.get(
  "/",
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.list,
  asyncHandler(controller.list)
);
// Retrieve one user
router.get(
  "/:userId",
  validator.id,
  authorizeOwnership("userId"),
  asyncHandler(controller.getOne)
);
// Update a user account
router.put(
  "/:userId",
  validator.update,
  asyncHandler(controller.update)
);
// Update account status
router.patch(
  "/:userId/status",
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.status,
  asyncHandler(controller.updateStatus)
);
// Deactivate a user account
router.delete(
  "/:userId",
  validator.id,
  asyncHandler(controller.remove)
);
module.exports = router;