const express = require("express");
const controller = require("../controllers/promotionController");
const validator = require("../validators/promotionValidator");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");
const router = express.Router();
// Retrieve promotions
router.get(
  "/",
  validator.list,
  asyncHandler(controller.list)
);
// Retrieve one promotion
router.get(
  "/:promotionId",
  validator.id,
  asyncHandler(controller.getOne)
);
// Create a promotion
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
// Update a promotion
router.put(
  "/:promotionId",
  authenticateToken,
  authorizeRole(
    ROLES.VENDOR,
    ROLES.ADMINISTRATOR
  ),
  validator.update,
  asyncHandler(controller.update)
);
// Deactivate a promotion
router.delete(
  "/:promotionId",
  authenticateToken,
  authorizeRole(
    ROLES.VENDOR,
    ROLES.ADMINISTRATOR
  ),
  validator.id,
  asyncHandler(controller.remove)
);
module.exports = router;