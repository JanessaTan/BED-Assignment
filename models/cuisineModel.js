const { sql, getPool } = require("../config/database");

async function listActive() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      CuisineID AS cuisineId,
      CuisineDesc AS name
    FROM dbo.Cuisine
    WHERE IsActive = 1
    ORDER BY CuisineDesc
  `);
  return result.recordset;
}

async function countActiveByIds(cuisineIds, transaction = null) {
  if (!cuisineIds.length) return 0;
  const pool = transaction || (await getPool());
  const request = transaction ? new sql.Request(transaction) : pool.request();
  const parameters = cuisineIds.map((id, index) => {
    request.input(`cuisine${index}`, sql.VarChar(10), id);
    return `@cuisine${index}`;
  });
  const result = await request.query(`
    SELECT COUNT(*) AS total
    FROM dbo.Cuisine
    WHERE IsActive = 1 AND CuisineID IN (${parameters.join(", ")})
  `);
  return result.recordset[0].total;
}

module.exports = { listActive, countActiveByIds };
