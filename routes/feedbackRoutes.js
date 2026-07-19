const express = require ('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.get('/', feedbackController.getFeedback);
router.get('/cat/:category', feedbackController.getFeedbackByCategory);
router.get('/subcat/:subcategory', feedbackController.getFeedbackBySubcategory);
router.get('/stall_id/:stallId', feedbackController.getFeedbackByStallId);
router.get('/:id', feedbackController.getFeedbackById);
router.post('/', feedbackController.submitFeedback);

module.exports = router;