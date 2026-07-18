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

// Get feedback by ID
async function getfeedbackById(req, res) {
  try {
    const id = req.params.id;
    const feedback = await feedbackModel.getfeedbackById(id);
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
async function submitfeedback(req, res) {
  try {
    const newfeedback = await feedbackModel.submitfeedback(req.body);
    res.status(201).json(newfeedback);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error creating feedback" });
  }
}


module.exports = {
    getFeedback,
    getfeedbackById,
    submitfeedback
}