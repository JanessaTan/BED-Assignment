const likeModel = require("../models/likeModel");

// Get all likes
async function getLikes(req, res) {
  try {
    const like = await likeModel.getLikes();
    res.json(like);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving like" });
  }
}

// Get likes by customer ID
async function getLikesByCustomerId(req, res) {
  try {
    const customerId = req.params.customerId;
    const like = await likeModel.getLikesByCustomerId(customerId);
    if (!like) {
      return res.status(404).json({ error: "like not found" });
    }

    res.json(like);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving like" });
  }
}

// Like a menu item
async function submitLike(req, res) {
  try {
    const newlike = await likeModel.submitLike(req.body);
    res.status(201).json(newlike);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error submitting like" });
  }
}


module.exports = {
    getLikes,
    getLikesByCustomerId,
    submitLike
}