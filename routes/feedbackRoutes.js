const express = require ('express');
const router = express.Router();
const stallController = require('../controllers/feedbackController');

router.get('/', stallController.getStalls);
router.get('/:id', stallController.getStall);
router.post('/', stallController.addStall);
router.put('/:id', stallController.editStall);
router.delete('/:id', stallController.removeStall);

module.exports = router;