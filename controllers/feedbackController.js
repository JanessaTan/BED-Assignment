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
    const newfeedback = await feedbackModel.submitFeedback(req.body);
    res.status(201).json(newfeedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error submitting feedback" });
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