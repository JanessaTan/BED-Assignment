const express = require("express");
const router = express.Router();

const salesDashboardController =
require("../controllers/salesController");

// GET sales dashboard
router.get(
    "/",
    salesController.getDashboard
);

module.exports = router;