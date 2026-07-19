const { sql, poolPromise } = require('../dbConfig');

// Get all feedback
async function getFeedback() {
  try{
    const connection = await poolPromise;
    const query = "SELECT * FROM Feedback"
    const request = await connection.request()
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

// Create new feedback
async function submitFeedback(feedbackData) {
  try {
    const connection = await poolPromise;
    const query = "INSERT INTO Feedback (Category, Subcategory, FbkComment, FbkDateTime, FbkRating, CustomerID, StallID) VALUES (@Category, @Subcategory, @FbkComment, GETDATE(), @FbkRating, @CustomerID, @StallID); SELECT SCOPE_IDENTITY() AS FbkID;";
    
    const request = connection.request();
    request.input("Category", feedbackData.Category);
    request.input("Subcategory", feedbackData.Subcategory);
    request.input("FbkComment", feedbackData.FbkComment);
    request.input("FbkRating", feedbackData.FbkRating);
    request.input("CustomerID", feedbackData.CustomerID);
    request.input("StallID", feedbackData.StallID);
    const result = await request.query(query);

    const newFeedbackId = result.recordset.FbkID;
    return await getFeedbackById(newFeedbackId);
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