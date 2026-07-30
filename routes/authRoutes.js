const express = require("express");
const authController = require("../controllers/authController");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");
const schemas = require("../validators/authSchemas");

const router = express.Router();

router.post("/register", validate(schemas.register), asyncHandler(authController.register));
router.post("/login", validate(schemas.login), asyncHandler(authController.login));
// Compatibility with the former two-tab login page.
router.post(
  "/vendor-login",
  validate(schemas.login),
  asyncHandler(authController.vendorLogin)
);

module.exports = router;
