const express = require("express");
const router = express.Router();

const checkoutController = require("../controllers/checkoutController");


// CREATE ORDER
router.post(
    "/",
    checkoutController.createOrder
);


// GET ORDER DETAILS
router.get(
    "/:id",
    checkoutController.getOrder
);


module.exports = router;