const express = require ('express');
const router = express.Router();
const stallController = require('../controllers/stallController');

router.get('/', stallController.getStalls);
router.get('/:id', stallController.getStall);
router.get('/:id/menu', stallController.getStallMenu);
router.post('/', stallController.addStall);
router.put('/:id', stallController.editStall);
router.delete('/:id', stallController.removeStall);

module.exports = router;