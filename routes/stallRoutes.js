const express = require("express");
const controller = require("../controllers/stallController");
const validator = require("../validators/stallValidator");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");
const router = express.Router();
// Retrieve stalls
router.get(
  "/",
  validator.list,
  asyncHandler(controller.list)
);
// Retrieve one stall
router.get(
  "/:stallId",
  validator.id,
  asyncHandler(controller.getOne)
);
// Create a stall
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
// Update a stall
router.put(
  "/:stallId",
  authenticateToken,
  authorizeRole(
    ROLES.VENDOR,
    ROLES.ADMINISTRATOR
  ),
  validator.update,
  asyncHandler(controller.update)
);
// Deactivate a stall
router.delete(
  "/:stallId",
  authenticateToken,
  authorizeRole(
    ROLES.VENDOR,
    ROLES.ADMINISTRATOR
  ),
  validator.id,
  asyncHandler(controller.remove)
);
module.exports = router;