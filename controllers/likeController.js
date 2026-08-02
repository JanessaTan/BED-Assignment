const likeModel = require("../models/likeModel");

async function getLikesByCustomer(req, res) {
  try {
    const customerID = req.params.customerID;

    const likes = await likeModel.getLikesByCustomer(customerID);

    res.status(200).json(likes);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      error: "Error retrieving customer likes"
    });
  }
}

async function getLikeCountsByStall(req, res) {
  try {
    const stallID = req.params.stallID;

    const likeCounts = await likeModel.getLikeCountsByStall(stallID);

    res.status(200).json(likeCounts);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      error: "Error retrieving like counts"
    });
  }
}

async function addLike(req, res) {
  try {
    const { CustomerID, StallID, ItemCode } = req.body;

    if (!CustomerID || !StallID || !ItemCode) {
      return res.status(400).json({
        message: "CustomerID, StallID and ItemCode are required"
      });
    }

    const result = await likeModel.addLike({
      CustomerID,
      StallID,
      ItemCode
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      error: "Error adding like"
    });
  }
}

async function removeLike(req, res) {
  try {
    const { customerID, stallID, itemCode } = req.params;

    if (!customerID || !stallID || !itemCode) {
      return res.status(400).json({
        message: "customerID, stallID and itemCode are required"
      });
    }

    const result = await likeModel.removeLike({
      CustomerID: customerID,
      StallID: stallID,
      ItemCode: itemCode
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      error: "Error removing like"
    });
  }
}

module.exports = {
  getLikesByCustomer,
  getLikeCountsByStall,
  addLike,
  removeLike
};