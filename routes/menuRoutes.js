const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware'); // match your existing exports

// Public — customers browsing (US-C1 already covers this, but kept here for completeness)
router.get('/stalls/:stallId/menu', menuController.listMenuItems);
router.get('/stalls/:stallId/menu/:itemCode', menuController.getMenuItem);

// Vendor only — US-SO2 Menu Management
router.post('/stalls/:stallId/menu', verifyToken, requireRole('vendor'), menuController.createMenuItem);
router.put('/stalls/:stallId/menu/:itemCode', verifyToken, requireRole('vendor'), menuController.updateMenuItem);
router.delete('/stalls/:stallId/menu/:itemCode', verifyToken, requireRole('vendor'), menuController.deleteMenuItem);

module.exports = router;
