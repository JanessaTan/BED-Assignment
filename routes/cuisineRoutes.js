const express = require("express");
const cuisineController = require("../controllers/cuisineController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(cuisineController.listCuisines));

module.exports = router;
