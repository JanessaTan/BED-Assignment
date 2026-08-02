const express = require ('express');
const router = express.Router();
const likeController = require('../controllers/likeController');

router.get("/customer/:customerID",likeController.getLikesByCustomer);
router.get("/stall/:stallID/counts",likeController.getLikeCountsByStall);
router.post("/",likeController.addLike);
router.delete("/:customerID/:stallID/:itemCode",likeController.removeLike);

module.exports = router;