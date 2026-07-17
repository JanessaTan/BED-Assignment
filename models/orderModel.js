const { sql, poolPromise } = require('../config/db');

// GET all orders
async function getAllOrders() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query('SELECT * FROM [Order]');
    return result.recordset;
}

// GET a single order by ID
async function getOrderById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM [Order] WHERE OrderID = @id');
    return result.recordset[0];
}

// GET all orders belonging to a specific customer
async function getOrdersByCustomer(customerId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('customerId', sql.Int, customerId)
        .query('SELECT * FROM [Order] WHERE CustomerID = @customerId ORDER BY OrderDate DESC');
    return result.recordset;
}

// CREATE a new order
async function createOrder(order) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('CustomerID', sql.Int, order.customerId)
        .input('StallID', sql.Int, order.stallId)
        .input('Status', sql.NVarChar, order.status || 'Pending')
        .input('TotalAmount', sql.Decimal(10, 2), order.totalAmount)
        .query(`INSERT INTO [Order] (CustomerID, StallID, OrderDate, Status, TotalAmount)
                OUTPUT INSERTED.*
                VALUES (@CustomerID, @StallID, GETDATE(), @Status, @TotalAmount)`);
    return result.recordset[0];
}

// UPDATE an existing order (e.g. status or total amount)
async function updateOrder(id, order) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .input('Status', sql.NVarChar, order.status)
        .input('TotalAmount', sql.Decimal(10, 2), order.totalAmount)
        .query(`UPDATE [Order]
                SET Status = @Status, TotalAmount = @TotalAmount
                OUTPUT INSERTED.*
                WHERE OrderID = @id`);
    return result.recordset[0];
}

// DELETE an order
async function deleteOrder(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM [Order] WHERE OrderID = @id');
    return result.rowsAffected[0] > 0;
}

module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer,
    createOrder,
    updateOrder,
    deleteOrder
};