const express = require('express');
const router = express.Router();
const hawkercentreController = require('../controllers/hawkercentreController');

// Public — anyone can browse/search hawker centres, no login required.
router.get('/', hawkercentreController.listHawkerCentres);
router.get('/search', hawkercentreController.searchHawkerCentres);
router.get('/nearby', hawkercentreController.getNearbyHawkerCentres);

module.exports = router;
