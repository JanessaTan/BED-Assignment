const sql = require('mssql');
const poolPromise = require('../config/db');

async function getAllHawkerCentres() {
  const pool = await poolPromise;
  const result = await pool.request().query(`SELECT * FROM HawkerCentre`);
  return result.recordset;
}

// GET /api/hawkercentres/search?q=clement
// Matches against name OR address (case-insensitive, partial match).
async function searchHawkerCentres(query) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('query', sql.VarChar(100), `%${query}%`)
    .query(`
      SELECT * FROM HawkerCentre
      WHERE HCName LIKE @query OR HCAddress LIKE @query
    `);
  return result.recordset;
}

// GET /api/hawkercentres/nearby?lat=1.28&lng=103.84&radiusKm=5
// Haversine formula computed directly in SQL — returns distance in km,
// sorted nearest first, filtered to within radiusKm.
async function getNearbyHawkerCentres(lat, lng, radiusKm) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('lat', sql.Decimal(9, 6), lat)
    .input('lng', sql.Decimal(9, 6), lng)
    .input('radiusKm', sql.Float, radiusKm)
    .query(`
      SELECT *,
        (6371 * ACOS(
          COS(RADIANS(@lat)) * COS(RADIANS(Latitude)) *
          COS(RADIANS(Longitude) - RADIANS(@lng)) +
          SIN(RADIANS(@lat)) * SIN(RADIANS(Latitude))
        )) AS DistanceKm
      FROM HawkerCentre
      WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL
      HAVING (6371 * ACOS(
          COS(RADIANS(@lat)) * COS(RADIANS(Latitude)) *
          COS(RADIANS(Longitude) - RADIANS(@lng)) +
          SIN(RADIANS(@lat)) * SIN(RADIANS(Latitude))
        )) <= @radiusKm
      ORDER BY DistanceKm ASC
    `);
  return result.recordset;
}

module.exports = {
  getAllHawkerCentres,
  searchHawkerCentres,
  getNearbyHawkerCentres,
};