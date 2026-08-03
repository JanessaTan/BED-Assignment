const express = require("express");
const router = express.Router();

const salesDashboardController = require("../controllers/salesController");
const authenticateToken = require("../middlewares/authenticateToken");
const authorizeRole = require("../middlewares/authorizeRole");
const { ROLES } = require("../config/constants");

router.get("/",
    authenticateToken,
    authorizeRole(ROLES.VENDOR), 
    salesDashboardController.getDashboard);

module.exports = router;