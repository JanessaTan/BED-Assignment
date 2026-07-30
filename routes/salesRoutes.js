const express = require("express");
const router = express.Router();

const salesDashboardController = require("../controllers/salesController");

router.get("/", salesDashboardController.getDashboard);

module.exports = router;