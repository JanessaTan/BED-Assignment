const { sql, poolPromise } = require('../dbConfig');

// Get all feedback
async function getFeedback() {
  try{
    const connection = await poolPromise;
    const query = `
    SELECT Feedback.*, Customer.CustName
    FROM Feedback INNER JOIN Customer
    ON Feedback.CustomerID = Customer.CustomerID`;

    const request = connection.request()
    const result = await request.query(query);
    return result.recordset
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } 
}

// Get feedback by Category
async function getFeedbackByCategory(category) {
  try{
    const connection = await poolPromise;
    const query = `
    SELECT Feedback.*, Customer.CustName
    FROM Feedback INNER JOIN Customer
    ON Feedback.CustomerID = Customer.CustomerID
    WHERE Feedback.Category = @category`;

    const request = connection.request();
    request.input("category", category);
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return null; // Feedback not found
    }
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Get feedback by Subcategory
async function getFeedbackBySubcategory(subcategory) {
  try{
    const connection = await poolPromise;
    const query = `
    SELECT Feedback.*, Customer.CustName
    FROM Feedback INNER JOIN Customer
    ON Feedback.CustomerID = Customer.CustomerID
    WHERE Feedback.Subcategory = @subcategory`;

    const request = connection.request();
    request.input("subcategory", subcategory);
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return null; // Feedback not found
    }
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Get feedback by Stall ID
async function getFeedbackByStallId(stallId) {
  try{
    const connection = await poolPromise;
    const query = `
    SELECT Feedback.*, Customer.CustName
    FROM Feedback INNER JOIN Customer
    ON Feedback.CustomerID = Customer.CustomerID
    WHERE Feedback.StallID = @stallId`;

    const request = connection.request();
    request.input("stallId", stallId);
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return null; // Feedback not found
    }
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Get feedback by ID
async function getFeedbackById(id) {
  try{
    const connection = await poolPromise;
    const query = `
    SELECT Feedback.*, Customer.CustName
    FROM Feedback INNER JOIN Customer
    ON Feedback.CustomerID = Customer.CustomerID
    WHERE Feedback.FbkID = @id`;

    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return null; // Feedback not found
    }
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Get new Feedback ID (next one after the last one)
async function getNextFbkId() {
    const connection = await poolPromise;
    const query = `SELECT TOP 1 FbkID FROM Feedback ORDER BY FbkID DESC`;
    const request = connection.request()
    const result = await request.query(query);
    const lastId = result.recordset[0]?.FbkID;
    const nextId = lastId ? parseInt(lastId.substring(1)) + 1 : 1;
    return 'DFB' + String(nextId).padStart(3, '0');
}

async function getCustomerIdByUserId(userId) {
  try {
    const connection = await poolPromise;

    const query = `
      SELECT TOP 1 c.CustomerID
      FROM Customer c
      INNER JOIN users u
        ON LOWER(c.Email) = LOWER(u.email)
      WHERE u.user_id = @userId
    `;

    const request = connection.request();
    request.input("userId", sql.Int, Number(userId));

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0].CustomerID;

  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

async function customerExists(customerID) {
  const connection = await poolPromise;

  const query = `
    SELECT CustomerID
    FROM Customer
    WHERE CustomerID = @CustomerID
  `;

  const request = connection.request();
  request.input("CustomerID", sql.VarChar, customerID);

  const result = await request.query(query);
  return result.recordset.length > 0;
}

async function stallExists(stallID) {
  const connection = await poolPromise;

  const query = `
    SELECT StallID
    FROM FoodStall
    WHERE StallID = @StallID
  `;

  const request = connection.request();
  request.input("StallID", sql.VarChar, stallID);

  const result = await request.query(query);
  return result.recordset.length > 0;
}

// Create new feedback
async function submitFeedback(feedbackData) {
  try {
    const connection = await poolPromise;
    const newFbkId = await getNextFbkId();

    let customerID = feedbackData.CustomerID;

    if (!customerID && feedbackData.UserID) {
      customerID = await getCustomerIdByUserId(feedbackData.UserID);
    }

    if (!customerID) {
      throw new Error("Customer account not found for this logged-in user.");
    }

    const validCustomer = await customerExists(customerID);

    if (!validCustomer) {
      throw new Error(`CustomerID does not exist in Customer table: ${customerID}`);
    }

    const validStall = await stallExists(feedbackData.StallID);

    if (!validStall) {
      throw new Error(`StallID does not exist in FoodStall table: ${feedbackData.StallID}`);
    }

    const query = `
      INSERT INTO Feedback 
      (
        FbkID, 
        Category, 
        Subcategory, 
        FbkComment, 
        FbkDateTime, 
        FbkRating, 
        CustomerID, 
        StallID
      ) 
      VALUES 
      (
        @FbkID, 
        @Category, 
        @Subcategory, 
        @FbkComment, 
        GETDATE(), 
        @FbkRating, 
        @CustomerID, 
        @StallID
      )
    `;

    const request = connection.request();

    request.input("FbkID", sql.VarChar, newFbkId);
    request.input("Category", sql.VarChar, feedbackData.Category);
    request.input("Subcategory", sql.VarChar, feedbackData.Subcategory);
    request.input("FbkComment", sql.VarChar, feedbackData.FbkComment);
    request.input("FbkRating", sql.Int, feedbackData.FbkRating);
    request.input("CustomerID", sql.VarChar, customerID);
    request.input("StallID", sql.VarChar, feedbackData.StallID);

    await request.query(query);

    return await getFeedbackById(newFbkId);

  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

module.exports = {
    getFeedback,
    getFeedbackByCategory,
    getFeedbackBySubcategory,
    getFeedbackByStallId,
    getFeedbackById,
    getCustomerIdByUserId,
    submitFeedback
}