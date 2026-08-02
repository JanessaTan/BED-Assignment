const { sql, poolPromise } = require('../dbConfig');

// Get all likes by Customer ID
async function getLikesByCustomer(customerID) {
  try {
    const connection = await poolPromise;
    const query = `
    SELECT CustomerID, StallID, ItemCode
    FROM Likes
    WHERE CustomerID = @CustomerID`;
    
    const request = connection.request();
    request.input("CustomerID", sql.VarChar, customerID);

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Get like counts for all menu items in a stall
async function getLikeCountsByStall(stallID) {
  try {
    const connection = await poolPromise;
    const query = `
    SELECT StallID, ItemCode, COUNT(*) AS LikeCount
    FROM Likes
    WHERE StallID = @StallID
    GROUP BY StallID, ItemCode`;
    
    const request = connection.request();
    request.input("StallID", sql.VarChar, stallID);

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Get like count for one menu item
async function getItemLikeCount(stallID, itemCode) {
  try {
    const connection = await poolPromise;
    const query = `
    SELECT COUNT(*) AS LikeCount
    FROM Likes
    WHERE StallID = @StallID 
    AND ItemCode = @ItemCode`;

    const request = connection.request();
    request.input("StallID", sql.VarChar, stallID);
    request.input("ItemCode", sql.VarChar, itemCode);

    const result = await request.query(query);
    return result.recordset[0].LikeCount;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Add a like
async function addLike(likeData) {
  try {
    const connection = await poolPromise;
    const checkQuery = `
    SELECT CustomerID
    FROM Likes
    WHERE CustomerID = @CustomerID 
    AND StallID = @StallID 
    AND ItemCode = @ItemCode`;

    const checkRequest = connection.request();
    checkRequest.input("CustomerID", sql.VarChar, likeData.CustomerID);
    checkRequest.input("StallID", sql.VarChar, likeData.StallID);
    checkRequest.input("ItemCode", sql.VarChar, likeData.ItemCode);

    const existing = await checkRequest.query(checkQuery);

    if (existing.recordset.length === 0) {
      const insertQuery = `
      INSERT INTO Likes
      (
        CustomerID,
        StallID,
        ItemCode
      )
      VALUES
      (
        @CustomerID,
        @StallID,
        @ItemCode
      )`;

      const insertRequest = connection.request();
      insertRequest.input("CustomerID", sql.VarChar, likeData.CustomerID);
      insertRequest.input("StallID", sql.VarChar, likeData.StallID);
      insertRequest.input("ItemCode", sql.VarChar, likeData.ItemCode);

      await insertRequest.query(insertQuery);
    }

    const likeCount = await getItemLikeCount(
      likeData.StallID,
      likeData.ItemCode
    );

    return {
      liked: true,
      CustomerID: likeData.CustomerID,
      StallID: likeData.StallID,
      ItemCode: likeData.ItemCode,
      LikeCount: likeCount
    };
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Remove a like
async function removeLike(likeData) {
  try {
    const connection = await poolPromise;
    const query = `
    DELETE FROM Likes
    WHERE CustomerID = @CustomerID 
    AND StallID = @StallID 
    AND ItemCode = @ItemCode`;

    const request = connection.request();
    request.input("CustomerID", sql.VarChar, likeData.CustomerID);
    request.input("StallID", sql.VarChar, likeData.StallID);
    request.input("ItemCode", sql.VarChar, likeData.ItemCode);

    await request.query(query);
    const likeCount = await getItemLikeCount(
      likeData.StallID,
      likeData.ItemCode
    );

    return {
      liked: false,
      CustomerID: likeData.CustomerID,
      StallID: likeData.StallID,
      ItemCode: likeData.ItemCode,
      LikeCount: likeCount
    };
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

module.exports = {
  getLikesByCustomer,
  getLikeCountsByStall,
  getItemLikeCount,
  addLike,
  removeLike
};