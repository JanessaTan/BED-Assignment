const feedbackModel = require("../models/feedbackModel");

// Get all feedback
async function getFeedback(req, res) {
  try {
    const feedback = await feedbackModel.getFeedback();
    res.json(feedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedback" });
  }
}

// Get feedback by Category
async function getFeedbackByCategory(req, res) {
  try {
    const category = req.params.category;
    const feedback = await feedbackModel.getFeedbackByCategory(category);
    if (!feedback) {
      return res.status(404).json({ error: "feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedback" });
  }
}

// Get feedback by Subcategory
async function getFeedbackBySubcategory(req, res) {
  try {
    const subcategory = req.params.subcategory;
    const feedback = await feedbackModel.getFeedbackBySubcategory(subcategory);
    if (!feedback) {
      return res.status(404).json({ error: "feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedback" });
  }
}

// Get feedback by Stall ID
async function getFeedbackByStallId(req, res) {
  try {
    const stallId = req.params.stallId;
    const feedback = await feedbackModel.getFeedbackByStallId(stallId);
    if (!feedback) {
      return res.status(404).json({ error: "feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedback" });
  }
}

// Get feedback by ID
async function getFeedbackById(req, res) {
  try {
    const id = req.params.id;
    const feedback = await feedbackModel.getFeedbackById(id);
    if (!feedback) {
      return res.status(404).json({ error: "feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving feedback" });
  }
}

// Submit new feedback
async function submitFeedback(req, res) {
  try {
    let {
      Category,
      Subcategory,
      FbkComment,
      FbkRating,
      CustomerID,
      UserID,
      StallID
    } = req.body;

    if (!Category || !Subcategory || !FbkComment || !FbkRating || !StallID) {
      return res.status(400).json({
        message: "Please fill in all feedback fields"
      });
    }

    if (CustomerID && !UserID && /^\d+$/.test(String(CustomerID))) {
      UserID = Number(CustomerID);
      CustomerID = null;
    }

    if (!CustomerID && !UserID) {
      return res.status(400).json({
        message: "CustomerID or UserID is required"
      });
    }

    const feedbackData = {
      Category,
      Subcategory,
      FbkComment,
      FbkRating,
      CustomerID,
      UserID,
      StallID
    };

    const newfeedback = await feedbackModel.submitFeedback(feedbackData);
    res.status(201).json(newfeedback);

  } catch (error) {
    console.error("Controller error:", error);

    res.status(500).json({
      error: "Error submitting feedback",
      message: error.message
    });
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