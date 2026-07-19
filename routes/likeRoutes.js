const express = require ('express');
const router = express.Router();
const likeController = require('../controllers/likeController');

router.get('/', likeController.getLikes);
router.get('/:customerId', likeController.getLikesByCustomerId);
router.post('/', likeController.submitLike);

module.exports = router;