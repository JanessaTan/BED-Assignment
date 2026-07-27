const express = require("express");
const router = express.Router();

const salesController =
require("../controllers/salesController");

// GET sales dashboard
router.get(
    "/",
    salesController.getDashboard
);

module.exports = router;