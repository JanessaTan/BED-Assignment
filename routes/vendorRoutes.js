const express = require("express");
const router = express.Router();
console.log("Vendor route loaded");

const vendorController = require("../controllers/vendorController");

const authenticateToken = require("../middlewares/authenticateToken");


router.get(
    "/stall",
    // authenticateToken,
    vendorController.getVendorStall
);


module.exports = router;