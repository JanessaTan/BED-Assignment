const orderModel = require('../models/orderModel');
const Joi = require('joi');

// Validation schema for creating an order
const createOrderSchema = Joi.object({
    customerId: Joi.number().integer().required(),
    stallId: Joi.number().integer().required(),
    status: Joi.string().valid('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'),
    totalAmount: Joi.number().positive().required()
});

// Validation schema for updating an order
const updateOrderSchema = Joi.object({
    status: Joi.string().valid('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled').required(),
    totalAmount: Joi.number().positive().required()
});

// GET /api/orders
async function getOrders(req, res) {
    try {
        const orders = await orderModel.getAllOrders();
        res.status(200).json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching orders', error: err.message });
    }
}

// GET /api/orders/:id
async function getOrder(req, res) {
    try {
        const order = await orderModel.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching order', error: err.message });
    }
}

// GET /api/orders/customer/:customerId
async function getOrdersByCustomer(req, res) {
    try {
        const orders = await orderModel.getOrdersByCustomer(req.params.customerId);
        res.status(200).json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching customer orders', error: err.message });
    }
}

// POST /api/orders
async function addOrder(req, res) {
    try {
        const { error, value } = createOrderSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const newOrder = await orderModel.createOrder(value);
        res.status(201).json(newOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating order', error: err.message });
    }
}

// PUT /api/orders/:id
async function editOrder(req, res) {
    try {
        const { error, value } = updateOrderSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const existing = await orderModel.getOrderById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const updated = await orderModel.updateOrder(req.params.id, value);
        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating order', error: err.message });
    }
}

// DELETE /api/orders/:id
async function removeOrder(req, res) {
    try {
        const existing = await orderModel.getOrderById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await orderModel.deleteOrder(req.params.id);
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting order', error: err.message });
    }
}

module.exports = {
    getOrders,
    getOrder,
    getOrdersByCustomer,
    addOrder,
    editOrder,
    removeOrder
};