const express = require("express");
const router = express.Router();

<<<<<<< HEAD
const salesDashboardController = require("../controllers/salesController");
=======
const salesController =
require("../controllers/salesController");
>>>>>>> 2e5f3d7a590481cab95409cae266bd6840c0d32f

router.get("/", salesDashboardController.getDashboard);

module.exports = router;