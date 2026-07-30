const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { verifyJWT } = require('../middlewares/auth');

// Public — anyone can browse a stall's promotions
router.get('/:id/promotions', promotionController.listPromotions);
router.get('/:id/promotions/active', promotionController.listActivePromotions);

// Vendor-only — ownership is checked inside the controller via req.user.ownerId
router.post('/:id/promotions', verifyJWT, promotionController.createPromotion);
router.put('/:id/promotions/:promoId', verifyJWT, promotionController.updatePromotion);
router.delete('/:id/promotions/:promoId', verifyJWT, promotionController.deletePromotion);

module.exports = router;