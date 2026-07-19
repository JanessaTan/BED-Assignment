const express = require("express");
const router = express.Router();
const hygieneController =
require("../controllers/hygieneController");


// GET current hygiene
router.get(
    "/:id",
    hygieneController.getCurrentHygiene
);

// CREATE hygiene
router.post(
    "/:id",
    hygieneController.createHygiene
);

// UPDATE hygiene
router.put(
    "/inspection/:id",
    hygieneController.updateHygiene
);

module.exports = router;