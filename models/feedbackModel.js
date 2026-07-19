const { sql, poolPromise } = require('../dbConfig');

// Get all feedback
async function getFeedback() {
  try{
    const connection = await poolPromise;
    const query = "SELECT * FROM Feedback"
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
    const query = "SELECT * FROM Feedback WHERE Category = @category";
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
    const query = "SELECT * FROM Feedback WHERE Subcategory = @subcategory";
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
    const query = "SELECT * FROM Feedback WHERE StallID = @stallId";
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
    const query = "SELECT * FROM Feedback WHERE FbkID = @id";
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
    const query = "SELECT TOP 1 FbkID FROM Feedback ORDER BY FbkID DESC"
    const request = connection.request()
    const result = await request.query(query);
    const lastId = result.recordset[0]?.FbkID;
    const nextId = lastId ? parseInt(lastId.substring(1)) + 1 : 1;
    return 'F' + String(nextId).padStart(3, '0');
}

// Create new feedback
async function submitFeedback(feedbackData) {
  try {
    const connection = await poolPromise;
    const newFbkId = await getNextFbkId();

    const query = "INSERT INTO Feedback (FbkID, Category, Subcategory, FbkComment, FbkDateTime, FbkRating, CustomerID, StallID) VALUES (@FbkID, @Category, @Subcategory, @FbkComment, GETDATE(), @FbkRating, @CustomerID, @StallID)";
    const request = connection.request();

    request.input("FbkID", newFbkId);
    request.input("Category", feedbackData.Category);
    request.input("Subcategory", feedbackData.Subcategory);
    request.input("FbkComment", feedbackData.FbkComment);
    request.input("FbkRating", feedbackData.FbkRating);
    request.input("CustomerID", feedbackData.CustomerID);
    request.input("StallID", feedbackData.StallID);

    const result = await request.query(query);
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
    submitFeedback
}