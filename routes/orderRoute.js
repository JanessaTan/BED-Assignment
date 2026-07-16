const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getOrders);
router.get('/customer/:customerId', orderController.getOrdersByCustomer);
router.get('/:id', orderController.getOrder);
router.post('/', orderController.addOrder);
router.put('/:id', orderController.editOrder);
router.delete('/:id', orderController.removeOrder);

module.exports = router;