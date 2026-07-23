const express = require('express');
const router = express.Router();
const stallController = require('../controllers/stallController');
const menuController = require('../controllers/menuController');
const promotionController = require('../controllers/promotionController');
const { verifyJWT } = require('../middlewares/auth');

router.get('/', stallController.getStalls);
router.get('/:id', stallController.getStall);
router.get('/:id/menu', stallController.getStallMenu);
router.post('/', stallController.addStall);
router.put('/:id', stallController.editStall);
router.delete('/:id', stallController.removeStall);

// US-SO2 Menu Management (vendor only) — added alongside existing stall routes
// since /:id/menu already lives here for browsing.
router.post('/:id/menu', verifyJWT, menuController.createMenuItem);
router.put('/:id/menu/:itemCode', verifyJWT, menuController.updateMenuItem);
router.delete('/:id/menu/:itemCode', verifyJWT, menuController.deleteMenuItem);

// US-SO3 Promotion Running (vendor only for write; open read for browsing/US-C8).
router.get('/:id/promotions', promotionController.listPromotions);
router.get('/:id/promotions/active', promotionController.listActivePromotions);
router.post('/:id/promotions', verifyJWT, promotionController.createPromotion);
router.put('/:id/promotions/:promoId', verifyJWT, promotionController.updatePromotion);
router.delete('/:id/promotions/:promoId', verifyJWT, promotionController.deletePromotion);

module.exports = router;