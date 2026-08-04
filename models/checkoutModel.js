const { sql, poolPromise } = require("../dbConfig");

function createModelError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getCustomerId(userId) {
  const connection = await poolPromise;
  const result = await connection.request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT TOP (1)
        c.CustomerID
      FROM dbo.Customer AS c
      LEFT JOIN dbo.users AS u
        ON u.user_id = @userId
      WHERE c.LinkedUserID = @userId
         OR (
           c.LinkedUserID IS NULL
           AND u.email IS NOT NULL
           AND LOWER(c.Email) = LOWER(u.email)
         )
      ORDER BY CASE WHEN c.LinkedUserID = @userId THEN 0 ELSE 1 END;
    `);

  if (result.recordset.length === 0) {
    throw createModelError(
      404,
      "Customer compatibility record was not found for this login. Check dbo.Customer.LinkedUserID."
    );
  }

  return result.recordset[0].CustomerID;
}

async function createOrder(data) {
  const connection = await poolPromise;
  const transaction = new sql.Transaction(connection);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    const nextResult = await new sql.Request(transaction).query(`
      SELECT
        ISNULL(
          MAX(TRY_CONVERT(INT, SUBSTRING(OrderID, 2, 9))),
          0
        ) + 1 AS NextNumber
      FROM dbo.CustOrder WITH (UPDLOCK, HOLDLOCK)
      WHERE OrderID LIKE 'O%';
    `);

    const nextNumber = Number(nextResult.recordset[0].NextNumber);
    const orderID = `O${String(nextNumber).padStart(3, "0")}`;

    await new sql.Request(transaction)
      .input("OrderID", sql.VarChar(10), orderID)
      .input("PmtType", sql.VarChar(30), data.pmtType)
      .input("CustomerID", sql.VarChar(5), data.customerId)
      .input("PickupTime", sql.DateTime2, data.pickupTime || null)
      .query(`
        INSERT INTO dbo.CustOrder
          (OrderID, OrderDate, PmtType, CustomerID, PickupTime)
        VALUES
          (@OrderID, CONVERT(DATE, GETDATE()), @PmtType, @CustomerID, @PickupTime);
      `);

    let itemNo = 1;

    for (const item of data.items) {
      const mappingResult = await new sql.Request(transaction)
        .input("stallId", sql.Int, item.stallId)
        .input("menuItemId", sql.Int, item.menuItemId)
        .query(`
          SELECT TOP (1)
            legacyStall.StallID,
            legacyItem.ItemCode,
            normalItem.price AS UnitPrice
          FROM dbo.menu_items AS normalItem
          INNER JOIN dbo.stalls AS normalStall
            ON normalStall.stall_id = normalItem.stall_id
          INNER JOIN dbo.FoodStall AS legacyStall
            ON legacyStall.LinkedStallID = normalStall.stall_id
          INNER JOIN dbo.MenuItem AS legacyItem
            ON legacyItem.LinkedMenuItemID = normalItem.menu_item_id
           AND legacyItem.StallID = legacyStall.StallID
          WHERE normalItem.menu_item_id = @menuItemId
            AND normalItem.stall_id = @stallId
            AND normalItem.is_available = 1
            AND normalStall.is_active = 1
            AND legacyItem.IsAvailable = 1
            AND legacyStall.IsActive = 1;
        `);

      if (mappingResult.recordset.length === 0) {
        throw createModelError(
          400,
          `Menu item ${item.menuItemId} is unavailable or its legacy checkout mapping is missing.`
        );
      }

      const mapping = mappingResult.recordset[0];

      await new sql.Request(transaction)
        .input("OrderID", sql.VarChar(10), orderID)
        .input("OrderItemNo", sql.Int, itemNo)
        .input("StallID", sql.VarChar(4), mapping.StallID)
        .input("ItemCode", sql.VarChar(10), mapping.ItemCode)
        .input("Quantity", sql.Int, item.quantity)
        .input("UnitPrice", sql.Decimal(10, 2), mapping.UnitPrice)
        .query(`
          INSERT INTO dbo.OrderItem
            (OrderID, OrderItemNo, StallID, ItemCode, Quantity, UnitPrice)
          VALUES
            (@OrderID, @OrderItemNo, @StallID, @ItemCode, @Quantity, @UnitPrice);
        `);

      itemNo += 1;
    }

    await transaction.commit();
    return orderID;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("CHECKOUT ROLLBACK ERROR:", rollbackError);
    }
    throw error;
  }
}

async function getOrder(orderID, customerId) {
  const connection = await poolPromise;
  const result = await connection.request()
    .input("OrderID", sql.VarChar(10), orderID)
    .input("CustomerID", sql.VarChar(5), customerId)
    .query(`
      SELECT
        O.OrderID,
        O.OrderDate,
        O.PmtType,
        O.CustomerID,
        O.PickupTime,
        OI.OrderItemNo,
        OI.StallID,
        FS.StallName,
        OI.ItemCode,
        MI.ItemDesc AS ItemName,
        OI.Quantity,
        OI.UnitPrice
      FROM dbo.CustOrder AS O
      INNER JOIN dbo.OrderItem AS OI
        ON O.OrderID = OI.OrderID
      INNER JOIN dbo.FoodStall AS FS
        ON FS.StallID = OI.StallID
      INNER JOIN dbo.MenuItem AS MI
        ON MI.StallID = OI.StallID
       AND MI.ItemCode = OI.ItemCode
      WHERE O.OrderID = @OrderID
        AND O.CustomerID = @CustomerID
      ORDER BY OI.OrderItemNo;
    `);

  if (result.recordset.length === 0) {
    throw createModelError(404, "Order not found.");
  }

  return result.recordset;
}

module.exports = {
  createOrder,
  getOrder,
  getCustomerId
};
