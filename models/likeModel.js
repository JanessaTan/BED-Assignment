const { sql, poolPromise } = require('../dbConfig');

// Get all menu items and like counts
async function getLikes() {
  try{
    const connection = await poolPromise;
    const query = `SELECT m.*, COUNT(l.CustomerID) AS "Likes"
    FROM MenuItem m LEFT JOIN Likes l
    ON (m.StallID = l.StallID AND m.ItemCode = l.ItemCode)
    GROUP BY m.ItemCategory, m.ItemCode, m.ItemDesc, m.ItemPrice, m.StallID`;
    const request = connection.request()
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } 
}

// Get menu items by customer ID (who liked the items)
async function getLikesByCustomerId(customerId) {
  try{
    const connection = await poolPromise;
    const query = `SELECT m.StallID, m.ItemCode, m.ItemDesc, m.ItemPrice, m.ItemCategory
    FROM MenuItem m LEFT JOIN Likes l
    ON (m.StallID = l.StallID AND m.ItemCode = l.ItemCode)
    WHERE l.CustomerID = @customerId`;
    const request = connection.request();
    request.input("customerId", customerId);
    const result = await request.query(query);
    if (result.length === 0) {
      return null; // Feedback not found
    }
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Like a menu item
async function submitLike(likeData) {
  try {
    const connection = await poolPromise;

    const query = `INSERT INTO Likes (CustomerID, StallID, ItemCode) 
    VALUES (@CustomerID, @StallID, @ItemCode)`;
    const request = connection.request();

    request.input("CustomerID", likeData.CustomerID);
    request.input("StallID", likeData.StallID);
    request.input("ItemCode", likeData.ItemCode);

    const result = await request.query(query);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}


module.exports = {
    getLikes,
    getLikesByCustomerId,
    submitLike
}