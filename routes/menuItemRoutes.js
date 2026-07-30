const express = require("express");
const menuItemController = require("../controllers/menuItemController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validators/menuItemSchemas");

const router = express.Router();

router.get(
  "/",
  validate(schemas.listQuery, "query"),
  asyncHandler(menuItemController.listMenuItems)
);
router.get(
  "/vendor/stalls",
  authenticate,
  authorize("vendor"),
  asyncHandler(menuItemController.listOwnedStalls)
);
router.get(
  "/vendor/mine",
  authenticate,
  authorize("vendor"),
  validate(schemas.listQuery, "query"),
  asyncHandler(menuItemController.listMyMenuItems)
);
router.post(
  "/",
  authenticate,
  authorize("vendor"),
  validate(schemas.create),
  asyncHandler(menuItemController.createMenuItem)
);
router.get(
  "/:itemId",
  validate(schemas.itemParams, "params"),
  asyncHandler(menuItemController.getMenuItem)
);
router.patch(
  "/:itemId",
  authenticate,
  authorize("vendor"),
  validate(schemas.itemParams, "params"),
  validate(schemas.update),
  asyncHandler(menuItemController.updateMenuItem)
);
router.delete(
  "/:itemId",
  authenticate,
  authorize("vendor"),
  validate(schemas.itemParams, "params"),
  asyncHandler(menuItemController.deleteMenuItem)
);

module.exports = router;
