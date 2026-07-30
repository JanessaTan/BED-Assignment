const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyJWT } = require('../middlewares/auth');

// Public — customers browsing (US-C1)
router.get('/:stallId/menu', menuController.listMenuItems);
router.get('/:stallId/menu/:itemCode', menuController.getMenuItem);

// Vendor only — US-SO2 Menu Management (role check happens inside verifyJWT via authorizedRoles)
router.post('/:stallId/menu', verifyJWT, menuController.createMenuItem);
router.put('/:stallId/menu/:itemCode', verifyJWT, menuController.updateMenuItem);
router.delete('/:stallId/menu/:itemCode', verifyJWT, menuController.deleteMenuItem);

module.exports = router;