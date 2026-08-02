const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

router.get('/', complaintController.getComplaints);
router.get('/stall/:stallId', complaintController.getComplaintsByStall);
router.get('/customer/:customerId', complaintController.getComplaintsByCustomer);
router.get('/:id', complaintController.getComplaint);

module.exports = router;