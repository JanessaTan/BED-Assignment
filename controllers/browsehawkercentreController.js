const hawkerCentreModel = require("../models/browseHawkerCentreModel");
const stallModel = require("../models/stallModel");
const {
  success,
  created
} = require("../utils/responseUtils");
const AppError = require("../utils/AppError");
// Retrieve all hawker centres
async function list(req, res) {
  const result = await hawkerCentreModel.list(req.query);
  return success(
    res,
    200,
    "Hawker centres retrieved",
    result.rows,
    {
      page: result.page,
      limit: result.limit,
      total: result.total
    }
  );
}
// Retrieve one hawker centre
async function getOne(req, res) {
  const centre = await hawkerCentreModel.findById(
    req.params.centreId
  );
  if (!centre) {
    throw new AppError(
      404,
      "Hawker centre was not found"
    );
  }
  return success(
    res,
    200,
    "Hawker centre retrieved",
    centre
  );
}
// Retrieve stalls from a hawker centre
async function stalls(req, res) {
  const centre = await hawkerCentreModel.findById(
    req.params.centreId
  );
  if (!centre) {
    throw new AppError(
      404,
      "Hawker centre was not found"
    );
  }
  const result = await stallModel.list({
    ...req.query,
    centreId: req.params.centreId,
    limit: req.query.limit || 100
  });
  return success(
    res,
    200,
    "Hawker centre stalls retrieved",
    result.rows,
    {
      total: result.total
    }
  );
}
// Search for a Singapore location
async function locationSearch(req, res) {
  const url = new URL(
    "https://nominatim.openstreetmap.org/search"
  );
  url.search = new URLSearchParams({
    format: "json",
    countrycodes: "sg",
    limit: "3",
    q: `${req.query.q}, Singapore`
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        process.env.NOMINATIM_USER_AGENT ||
        "HawkerHub-Student-Project/1.0"
    },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) {
    throw new AppError(
      502,
      "The location service is temporarily unavailable"
    );
  }
  const data = await response.json();
  const locations = data.map((item) => ({
    displayName: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    type: item.type
  }));
  return success(
    res,
    200,
    "Singapore location search completed",
    locations
  );
}
// Create a hawker centre
async function create(req, res) {
  const centre = await hawkerCentreModel.create(
    req.body
  );
  return created(
    res,
    "Hawker centre created",
    centre
  );
}
// Update a hawker centre
async function update(req, res) {
  const centreId = req.params.centreId;
  const centre = await hawkerCentreModel.findById(
    centreId
  );
  if (!centre) {
    throw new AppError(
      404,
      "Hawker centre was not found"
    );
  }
  const updatedCentre =
    await hawkerCentreModel.update(
      centreId,
      req.body
    );
  return success(
    res,
    200,
    "Hawker centre updated",
    updatedCentre
  );
}
// Deactivate a hawker centre
async function remove(req, res) {
  const removed = await hawkerCentreModel.remove(
    req.params.centreId
  );
  if (!removed) {
    throw new AppError(
      404,
      "Hawker centre was not found"
    );
  }
  return success(
    res,
    200,
    "Hawker centre deactivated",
    null
  );
}
module.exports = {
  list,
  getOne,
  stalls,
  locationSearch,
  create,
  update,
  remove
};