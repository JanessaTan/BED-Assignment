const express = require('express');
const router = express.Router();
const hygieneOverviewController = require('../controllers/hygieneOverviewController');

router.get('/', hygieneOverviewController.getAllStallHygieneGrades);
router.get('/stall/:stallId/history', hygieneOverviewController.getHygieneHistoryByStall);
router.get('/grade/:grade', hygieneOverviewController.getStallsByGrade);

module.exports = router;