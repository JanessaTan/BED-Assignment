const express = require("express");
const controller = require("../controllers/centreOperationController");
const validator = require("../validators/centreOperationValidator");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");
const router = express.Router();
// Allow operators and administrators
router.use(
  authenticateToken,
  authorizeRole(
    ROLES.OPERATOR,
    ROLES.ADMINISTRATOR
  )
);
// Retrieve managed stall operations
router.get(
  "/",
  asyncHandler(controller.list)
);
// Retrieve operation summary
router.get(
  "/summary",
  asyncHandler(controller.summary)
);
// Update a stall operation
router.put(
  "/:stallId",
  validator,
  asyncHandler(controller.update)
);
module.exports = router;