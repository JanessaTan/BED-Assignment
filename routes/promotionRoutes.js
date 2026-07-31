const express = require("express");
const promotionController = require("../controllers/promotionController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validators/promotionsSchemas");

const router = express.Router();

router.get(
  "/",
  validate(schemas.listQuery, "query"),
  asyncHandler(promotionController.listActivePromotions)
);
router.get(
  "/active",
  validate(schemas.listQuery, "query"),
  asyncHandler(promotionController.listActivePromotions)
);
router.get(
  "/mine",
  authenticate,
  authorize("vendor"),
  validate(schemas.listQuery, "query"),
  asyncHandler(promotionController.listMyPromotions)
);
router.post(
  "/",
  authenticate,
  authorize("vendor"),
  validate(schemas.create),
  asyncHandler(promotionController.createPromotion)
);
router.get(
  "/:promotionId",
  validate(schemas.promotionParams, "params"),
  asyncHandler(promotionController.getPromotion)
);
router.patch(
  "/:promotionId",
  authenticate,
  authorize("vendor"),
  validate(schemas.promotionParams, "params"),
  validate(schemas.update),
  asyncHandler(promotionController.updatePromotion)
);
router.delete(
  "/:promotionId",
  authenticate,
  authorize("vendor"),
  validate(schemas.promotionParams, "params"),
  asyncHandler(promotionController.deletePromotion)
);

module.exports = router;
