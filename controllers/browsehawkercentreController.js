
const hawkercentreModel = require('../models/browseHawkerCentreModel');
 
// GET /api/hawkercentres
async function listHawkerCentres(req, res) {
  try {
    const centres = await hawkercentreModel.getAllHawkerCentres();
    res.status(200).json(centres);
  } catch (err) {
    console.error('listHawkerCentres error:', err);
    res.status(500).json({ message: 'Unable to retrieve hawker centres. Please try again later.' });
  }
}
 
// GET /api/hawkercentres/search?q=clement
async function searchHawkerCentres(req, res) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Query parameter q is required, e.g. ?q=clement' });
    }
 
    const results = await hawkercentreModel.searchHawkerCentres(q.trim());
 
    // No hits for the typed area — fall back to the full list rather than
    // showing an empty page (per your friend's "same list" simplification).
    if (results.length === 0) {
      const all = await hawkercentreModel.getAllHawkerCentres();
      return res.status(200).json({ message: 'No exact matches found — showing all hawker centres.', results: all });
    }
 
    res.status(200).json({ results });
  } catch (err) {
    console.error('searchHawkerCentres error:', err);
    res.status(500).json({ message: 'Unable to search hawker centres. Please try again later.' });
  }
}
 
// GET /api/hawkercentres/nearby?lat=1.28&lng=103.84&radiusKm=5
async function getNearbyHawkerCentres(req, res) {
  try {
    const { lat, lng } = req.query;
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm) : 5;
 
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query parameters are required and must be numbers.' });
    }
 
    const results = await hawkercentreModel.getNearbyHawkerCentres(parseFloat(lat), parseFloat(lng), radiusKm);
 
    // Nothing within range — same fallback as search, so "near me" never
    // dead-ends with an empty result.
    if (results.length === 0) {
      const all = await hawkercentreModel.getAllHawkerCentres();
      return res.status(200).json({ message: `No hawker centres within ${radiusKm}km — showing all hawker centres.`, results: all });
    }
 
    res.status(200).json({ results });
  } catch (err) {
    console.error('getNearbyHawkerCentres error:', err);
    res.status(500).json({ message: 'Unable to find nearby hawker centres. Please try again later.' });
  }
}
 
module.exports = {
  listHawkerCentres,
  searchHawkerCentres,
  getNearbyHawkerCentres,
};
 
