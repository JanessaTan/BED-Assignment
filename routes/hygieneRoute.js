const express = require("express");
const router = express.Router();
const hygieneController =
require("../controllers/hygieneController");
const authenticateToken = require("../middlewares/authenticateToken");



// GET current hygiene
router.get(
    "/:id",
    hygieneController.getCurrentHygiene
);

// CREATE hygiene
router.post(
    "/",
    authenticateToken,
    hygieneController.createHygiene
);

// UPDATE hygiene
router.put(
    "/inspection/:id",
    hygieneController.updateHygiene
);

module.exports = router;