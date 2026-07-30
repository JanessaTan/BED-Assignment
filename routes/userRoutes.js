const express = require("express");
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const asyncHandler = require("../utils/asyncHandler");
const schemas = require("../validators/userSchemas");

const router = express.Router();
router.use(authenticate);

router.post(
  "/",
  authorize("administrator"),
  validate(schemas.adminCreate),
  asyncHandler(userController.createUser)
);
router.get(
  "/",
  authorize("administrator"),
  validate(schemas.listQuery, "query"),
  asyncHandler(userController.listUsers)
);
router.get("/me", asyncHandler(userController.getMe));
router.patch(
  "/me",
  validate(schemas.updateMe),
  asyncHandler(userController.updateMe)
);
router.get(
  "/:userId",
  validate(schemas.userParams, "params"),
  asyncHandler(userController.getUser)
);
router.patch(
  "/:userId",
  authorize("administrator"),
  validate(schemas.userParams, "params"),
  validate(schemas.adminUpdate),
  asyncHandler(userController.updateUser)
);
router.delete(
  "/:userId",
  authorize("administrator"),
  validate(schemas.userParams, "params"),
  asyncHandler(userController.deactivateUser)
);

module.exports = router;
