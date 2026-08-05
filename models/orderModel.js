const { sql, poolPromise } = require('../dbConfig');
 
// GET all orders
async function getAllOrders() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query('SELECT * FROM CustOrder');
    return result.recordset;
}
 
// GET a single order by ID
async function getOrderById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query('SELECT * FROM CustOrder WHERE OrderID = @id');
    return result.recordset[0];
}
 
// GET all orders belonging to a specific customer
async function getOrdersByCustomer(customerId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('customerId', sql.VarChar, customerId)
        .query('SELECT * FROM CustOrder WHERE CustomerID = @customerId ORDER BY OrderDate DESC');
    return result.recordset;
}
 
// GET all line items for a specific order (from OrderItem table)
async function getOrderItems(orderId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('orderId', sql.VarChar, orderId)
        .query(`
            SELECT
                oi.OrderID,
                oi.OrderItemNo,
                oi.StallID,
                fs.StallName,
                oi.ItemCode,
                mi.ItemDesc AS ItemName,
                oi.Quantity,
                oi.UnitPrice
            FROM OrderItem oi
            LEFT JOIN FoodStall fs
                ON fs.StallID = oi.StallID
            LEFT JOIN MenuItem mi
                ON mi.StallID = oi.StallID
               AND mi.ItemCode = oi.ItemCode
            WHERE oi.OrderID = @orderId
            ORDER BY oi.OrderItemNo
        `);
    return result.recordset;
}
 
// Generate the next OrderID in sequence, e.g. O043 -> O044
// (needed because OrderID is VARCHAR and hand-formatted, not auto-increment)
async function getNextOrderId() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query('SELECT TOP 1 OrderID FROM CustOrder ORDER BY OrderID DESC');
    const last = result.recordset[0]?.OrderID; // e.g. 'O043'
    const nextNum = last ? parseInt(last.substring(1)) + 1 : 1;
    return 'O' + String(nextNum).padStart(3, '0');
}
 
// CREATE a new order
async function createOrder(order) {
    const pool = await poolPromise;
    const newId = await getNextOrderId();
 
    await pool.request()
        .input('OrderID', sql.VarChar, newId)
        .input('OrderDate', sql.Date, order.orderDate || new Date())
        .input('PmtType', sql.VarChar, order.pmtType)
        .input('CustomerID', sql.VarChar, order.customerId)
        .query(`INSERT INTO CustOrder (OrderID, OrderDate, PmtType, CustomerID)
                VALUES (@OrderID, @OrderDate, @PmtType, @CustomerID)`);
 
    return getOrderById(newId);
}
 
// UPDATE an existing order (e.g. payment type)
async function updateOrder(id, order) {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.VarChar, id)
        .input('PmtType', sql.VarChar, order.pmtType)
        .query(`UPDATE CustOrder
                SET PmtType = @PmtType
                WHERE OrderID = @id`);
 
    return getOrderById(id);
}
 
// DELETE an order
async function deleteOrder(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.VarChar, id)
        .query('DELETE FROM CustOrder WHERE OrderID = @id');
    return true;
}
 
module.exports = {
    getAllOrders,
    getOrderById,
    getOrdersByCustomer,
    getOrderItems,
    createOrder,
    updateOrder,
    deleteOrder
};