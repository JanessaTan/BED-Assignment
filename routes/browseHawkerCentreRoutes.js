const express = require("express");
const controller = require("../controllers/browseHawkerCentreController");
const validator = require("../validators/browseHawkerCentreValidator");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");
const router = express.Router();
// Retrieve hawker centres
router.get(
  "/",
  validator.list,
  asyncHandler(controller.list)
);
// Search Singapore locations
router.get(
  "/location-search",
  validator.locationSearch,
  asyncHandler(controller.locationSearch)
);
// Retrieve one hawker centre
router.get(
  "/:centreId",
  validator.id,
  asyncHandler(controller.getOne)
);
// Retrieve stalls from a hawker centre
router.get(
  "/:centreId/stalls",
  validator.id,
  asyncHandler(controller.stalls)
);
// Create a hawker centre
router.post(
  "/",
  authenticateToken,
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.create,
  asyncHandler(controller.create)
);
// Update a hawker centre
router.put(
  "/:centreId",
  authenticateToken,
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.update,
  asyncHandler(controller.update)
);
// Deactivate a hawker centre
router.delete(
  "/:centreId",
  authenticateToken,
  authorizeRole(ROLES.ADMINISTRATOR),
  validator.id,
  asyncHandler(controller.remove)
);
module.exports = router;