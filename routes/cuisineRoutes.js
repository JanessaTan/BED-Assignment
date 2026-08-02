const express = require("express");
const controller = require("../controllers/cuisineController");
const validator = require("../validators/cuisineValidator");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");
const router = express.Router();
// Retrieve all cuisines
router.get(
  "/",
  asyncHandler(controller.list)
);
// Retrieve one cuisine
router.get(
  "/:cuisineId",
  validator.id,
  asyncHandler(controller.getOne)
);
// Create a cuisine
router.post(
  "/",
  authenticateToken,
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.create,
  asyncHandler(controller.create)
);
// Update a cuisine
router.put(
  "/:cuisineId",
  authenticateToken,
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.update,
  asyncHandler(controller.update)
);
// Delete a cuisine
router.delete(
  "/:cuisineId",
  authenticateToken,
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.id,
  asyncHandler(controller.remove)
);
module.exports = router;