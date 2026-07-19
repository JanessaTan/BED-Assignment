const express = require("express");
const router = express.Router();
const hygieneController =
require("../controllers/hygieneController");


// GET current hygiene
router.get(
    "/:id/hygiene",
    hygieneController.getCurrentHygiene
);

// CREATE hygiene
router.post(
    "/:id/hygiene",
    hygieneController.createHygiene
);

// UPDATE hygiene
router.put(
    "inspection/:id/hygiene",
    hygieneController.updateHygiene
);

module.exports = router;