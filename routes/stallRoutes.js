const express = require("express");
const stallController = require(
    "../controllers/stallController"
);

const router = express.Router();

router.get("/", stallController.getAllStalls);

// Put the more specific route before /:id
router.get("/:id/menu", stallController.getStallMenu);

router.get("/:id", stallController.getStall);
router.post("/", stallController.addStall);
router.put("/:id", stallController.editStall);
router.delete("/:id", stallController.removeStall);

module.exports = router;