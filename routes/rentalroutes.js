const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');

router.get('/', rentalController.getAgreements);
router.get('/owner/:ownerId', rentalController.getAgreementsByOwner);
router.get('/stall/:stallId', rentalController.getAgreementsByStall);
router.get('/:id', rentalController.getAgreement);
router.post('/', rentalController.signAgreement);
router.put('/:id', rentalController.editAgreement);
router.delete('/:id', rentalController.removeAgreement);

module.exports = router;