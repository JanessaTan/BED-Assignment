const express = require ('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.get('/', feedbackController.getFeedback);
router.get('/:id', feedbackController.getfeedbackById);
router.post('/', feedbackController.submitfeedback);

module.exports = router;