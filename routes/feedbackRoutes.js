const express = require ('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.get('/', feedbackController.getFeedback);
router.get('/:id', feedbackController.getFeedbackById);
router.post('/', feedbackController.submitFeedback);

module.exports = router;