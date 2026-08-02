const express = require("express");
const router = express.Router();

const checkoutController = require("../controllers/checkoutController");
// const authenticateToken = require("../middlewares/authenticateToken");

// CREATE ORDER
router.post(
    "/",
    // authenticateToken,
    checkoutController.createOrder
);


// GET ORDER DETAILS
router.get(
    "/:id",
    authenticateToken,
    checkoutController.getOrder
);


module.exports = router;