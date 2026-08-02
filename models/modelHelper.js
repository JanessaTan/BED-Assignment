const {
  sql,
  getPool
} = require("../config/database");
// Calculate pagination values
function pageValues(filters = {}) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 20);
  const offset = (page - 1) * limit;
  return {
    page,
    limit,
    offset
  };
}
// Create a database request
async function request() {
  const pool = await getPool();
  return pool.request();
}
// Convert separated text into an array
function csvToArray(rows, property) {
  return rows.map((row) => ({
    ...row,
    [property]: row[property]
      ? row[property].split("|")
      : []
  }));
}
module.exports = {
  sql,
  getPool,
  request,
  pageValues,
  csvToArray
};