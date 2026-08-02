const express = require("express");
const controller = require("../controllers/menuItemController");
const validator = require("../validators/menuItemValidator");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");
const router = express.Router();
// Retrieve menu items
router.get(
  "/",
  validator.list,
  asyncHandler(controller.list)
);
// Retrieve one menu item
router.get(
  "/:menuItemId",
  validator.id,
  asyncHandler(controller.getOne)
);
// Create a menu item
router.post(
  "/",
  authenticateToken,
  authorizeRole(
    ROLES.VENDOR,
    ROLES.ADMINISTRATOR
  ),
  validator.create,
  asyncHandler(controller.create)
);
// Update a menu item
router.put(
  "/:menuItemId",
  authenticateToken,
  authorizeRole(
    ROLES.VENDOR,
    ROLES.ADMINISTRATOR
  ),
  validator.update,
  asyncHandler(controller.update)
);
// Make a menu item unavailable
router.delete(
  "/:menuItemId",
  authenticateToken,
  authorizeRole(
    ROLES.VENDOR,
    ROLES.ADMINISTRATOR
  ),
  validator.id,
  asyncHandler(controller.remove)
);
module.exports = router;