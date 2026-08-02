const {
  body,
  validateRequest,
  positiveId
} = require("./commonValidator");
const {
  OPERATION_STATUSES
} = require("../config/constants");
// Validate stall operation details
module.exports = [
  positiveId("stallId"),
  body("operationalStatus")
    .isIn(OPERATION_STATUSES)
    .withMessage("Select a valid operational status"),
  body("maintenanceNote")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage(
      "Maintenance note can contain at most 250 characters"
    ),
  validateRequest
];