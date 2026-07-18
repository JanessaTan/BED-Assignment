const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all feedback
async function getFeedback() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Feedback";
    const result = await connection.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get feedback by ID
async function getFeedbackById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Feedback WHERE FbkID = @id";
    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Feedback not found
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Create new feedback
async function submitFeedback(feedbackData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "INSERT INTO Feedback (Category, Subcategory, FbkComment, FbkDateTime, FbkRating, CustomerID, StallID) VALUES (@Category, @Subcategory, @FbkComment, GETDATE(), @FbkRating, @CustomerID, @StallID); SELECT SCOPE_IDENTITY() AS FbkID;";
    const request = connection.request();
    request.input("Category", feedbackData.Category);
    request.input("Subcategory", feedbackData.Subcategory);
    request.input("FbkComment", feedbackData.FbkComment);
    request.input("FbkRating", feedbackData.FbkRating);
    request.input("CustomerID", feedbackData.CustomerID);
    request.input("StallID", feedbackData.StallID);
    const result = await request.query(query);

    const newFeedbackId = result.recordset[0].FbkID;
    return await getFeedbackById(newFeedbackId);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
    getFeedback,
    getFeedbackById,
    submitFeedback
}