const { sql, poolPromise } = require("../dbConfig");

// Total revenue, total orders, average order value
async function getSalesSummary(startDate, endDate) {
    try {
        const connection = await poolPromise;

        const query = `
            SELECT
                SUM(OrderTotal) AS TotalRevenue,
                COUNT(*) AS TotalOrders,
                AVG(OrderTotal) AS AverageOrderValue
            FROM (
                SELECT
                    CustOrder.OrderID,
                    SUM(OrderItem.Quantity * OrderItem.UnitPrice) AS OrderTotal
                FROM CustOrder
                JOIN OrderItem
                    ON CustOrder.OrderID = OrderItem.OrderID
                WHERE CustOrder.OrderDate BETWEEN @startDate AND @endDate
                GROUP BY CustOrder.OrderID
            ) AS Sales
        `;

        const request = connection.request();
        request.input("startDate",sql.Date, startDate);
        request.input("endDate",sql.Date, endDate);

        const result = await request.query(query);
        return result.recordset[0];

    } catch (error) {
        console.error("Summary error:", error);
        throw error;
    }
}

// Top 5 best-selling items
async function getTopItemsByQuantity(startDate, endDate) {
    try {
        const connection = await poolPromise;

        const query = `
            SELECT TOP 5
                MenuItem.ItemDesc,
                SUM(OrderItem.Quantity) AS QuantitySold
            FROM OrderItem
            JOIN CustOrder
                ON OrderItem.OrderID = CustOrder.OrderID
            JOIN MenuItem
                ON OrderItem.StallID = MenuItem.StallID
                AND OrderItem.ItemCode = MenuItem.ItemCode
            WHERE CustOrder.OrderDate BETWEEN @startDate AND @endDate
            GROUP BY MenuItem.ItemDesc
            ORDER BY QuantitySold DESC
        `;

        const request = connection.request();
        request.input("startDate",sql.Date, startDate);
        request.input("endDate",sql.Date, endDate);

        const result = await request.query(query);
        return result.recordset;

    } catch (error) {
        console.error("Top selling items error:", error);
        throw error;
    }
}

// Top 5 items by revenue
async function getTopItemsByRevenue(startDate, endDate) {
    try {
        const connection = await poolPromise;

        const query = `
            SELECT TOP 5
                MenuItem.ItemDesc,
                SUM(OrderItem.Quantity * OrderItem.UnitPrice) AS Revenue
            FROM OrderItem
            JOIN CustOrder
                ON OrderItem.OrderID = CustOrder.OrderID
            JOIN MenuItem
                ON OrderItem.StallID = MenuItem.StallID
                AND OrderItem.ItemCode = MenuItem.ItemCode
            WHERE CustOrder.OrderDate BETWEEN @startDate AND @endDate
            GROUP BY MenuItem.ItemDesc
            ORDER BY Revenue DESC
        `;

        const request = connection.request();
        request.input("startDate",sql.Date, startDate);
        request.input("endDate",sql.Date, endDate);

        const result = await request.query(query);
        return result.recordset;

    } catch (error) {
        console.error("Top 5 items error:", error);
        throw error;
    }
}

async function getSalesTrend(startDate, endDate){
    try{
        const connection = await poolPromise;

        const query = `

        SELECT
            CustOrder.OrderDate
            AS SaleDate,
            SUM(OrderItem.Quantity * OrderItem.UnitPrice)
            AS Revenue
        FROM CustOrder

        INNER JOIN OrderItem
        ON CustOrder.OrderID = OrderItem.OrderID
        WHERE CustOrder.OrderDate
        BETWEEN @startDate
        AND @endDate
        GROUP BY
            CustOrder.OrderDate
        ORDER BY
            CustOrder.OrderDate ASC
        `;

        const request = connection.request();
        request.input("startDate",sql.Date, startDate);
        request.input("endDate",sql.Date, endDate);

        const result =
        await request.query(query);
        return result.recordset;
    }

    catch(error){
        console.error("Sales trend error:", error);
        throw error;
    }
}

module.exports = {
    getSalesSummary,
    getTopItemsByQuantity,
    getTopItemsByRevenue,
    getSalesTrend
};