const cuisineModel = require("../models/cuisineModel");

async function listCuisines(req, res) {
  const cuisines = await cuisineModel.listActive();
  res.json({
    success: true,
    message: "Cuisines retrieved successfully",
    data: cuisines
  });
}

module.exports = { listCuisines };
