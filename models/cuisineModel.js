const {
  sql,
  request
} = require("./modelHelpers");
// Retrieve all cuisines
async function list() {
  const req = await request();
  const result = await req.query(`
    SELECT
      cuisine_id AS cuisineId,
      name
    FROM cuisines
    ORDER BY name;
  `);
  return result.recordset;
}
// Find a cuisine by ID
async function findById(cuisineId) {
  const req = await request();
  req.input(
    "cuisineId",
    sql.Int,
    cuisineId
  );
  const result = await req.query(`
    SELECT
      cuisine_id AS cuisineId,
      name
    FROM cuisines
    WHERE cuisine_id = @cuisineId;
  `);
  return result.recordset[0] || null;
}
// Create a cuisine
async function create(data) {
  const req = await request();
  req.input(
    "name",
    sql.NVarChar(80),
    data.name
  );
  const result = await req.query(`
    INSERT INTO cuisines (
      name
    )
    OUTPUT INSERTED.cuisine_id
    VALUES (
      @name
    );
  `);
  return findById(
    result.recordset[0].cuisine_id
  );
}
// Update a cuisine
async function update(cuisineId, data) {
  const req = await request();
  req.input(
    "cuisineId",
    sql.Int,
    cuisineId
  );
  req.input(
    "name",
    sql.NVarChar(80),
    data.name
  );
  await req.query(`
    UPDATE cuisines
    SET name = @name
    WHERE cuisine_id = @cuisineId;
  `);
  return findById(cuisineId);
}
// Delete a cuisine
async function remove(cuisineId) {
  const req = await request();
  req.input(
    "cuisineId",
    sql.Int,
    cuisineId
  );
  const result = await req.query(`
    DELETE FROM cuisines
    WHERE cuisine_id = @cuisineId;
    SELECT @@ROWCOUNT AS affected;
  `);
  return result.recordset[0].affected;
}
module.exports = {
  list,
  findById,
  create,
  update,
  remove
};