const {
  sql,
  request,
  pageValues
} = require("./modelHelpers");
// Select hawker centre information
const columns = `
  hc.centre_id AS centreId,
  hc.name,
  hc.town,
  hc.address,
  hc.nearest_mrt AS nearestMrt,
  hc.opening_hours AS openingHours,
  hc.description,
  hc.is_active AS isActive,
  (
    SELECT COUNT(*)
    FROM stalls s
    WHERE s.centre_id = hc.centre_id
      AND s.is_active = 1
  ) AS stallCount,
  cu.percentage AS crowdPercentage,
  cu.crowd_label AS crowdLevel,
  cu.estimated_seats AS estimatedSeats,
  cu.updated_at AS crowdUpdatedAt
`;
// Retrieve hawker centres
async function list(filters) {
  const { page, limit, offset } =
    pageValues(filters);
  const req = await request();
  req.input(
    "search",
    sql.NVarChar(100),
    filters.search
      ? `%${filters.search}%`
      : null
  );
  req.input(
    "town",
    sql.NVarChar(80),
    filters.town || null
  );
  req.input(
    "crowdLevel",
    sql.VarChar(20),
    filters.crowdLevel || null
  );
  req.input("offset", sql.Int, offset);
  req.input("limit", sql.Int, limit);
  const result = await req.query(`
    SELECT
      ${columns},
      COUNT(*) OVER() AS totalCount
    FROM hawker_centres hc
    OUTER APPLY (
      SELECT TOP (1)
        percentage,
        crowd_label,
        estimated_seats,
        updated_at
      FROM crowd_updates
      WHERE centre_id = hc.centre_id
      ORDER BY updated_at DESC
    ) cu
    WHERE hc.is_active = 1
      AND (
        @search IS NULL
        OR hc.name LIKE @search
        OR hc.town LIKE @search
        OR hc.address LIKE @search
        OR hc.nearest_mrt LIKE @search
      )
      AND (
        @town IS NULL
        OR hc.town = @town
      )
      AND (
        @crowdLevel IS NULL
        OR cu.crowd_label = @crowdLevel
      )
    ORDER BY hc.name
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);
  const total =
    result.recordset[0]?.totalCount || 0;
  const rows = result.recordset.map(
    ({ totalCount, ...row }) => row
  );
  return {
    rows,
    page,
    limit,
    total
  };
}
// Find a hawker centre by ID
async function findById(centreId) {
  const req = await request();
  req.input(
    "centreId",
    sql.Int,
    centreId
  );
  const result = await req.query(`
    SELECT ${columns}
    FROM hawker_centres hc
    OUTER APPLY (
      SELECT TOP (1)
        percentage,
        crowd_label,
        estimated_seats,
        updated_at
      FROM crowd_updates
      WHERE centre_id = hc.centre_id
      ORDER BY updated_at DESC
    ) cu
    WHERE hc.centre_id = @centreId;
  `);
  return result.recordset[0] || null;
}
// Create a hawker centre
async function create(data) {
  const req = await request();
  req.input(
    "name",
    sql.NVarChar(150),
    data.name
  );
  req.input(
    "town",
    sql.NVarChar(80),
    data.town
  );
  req.input(
    "address",
    sql.NVarChar(250),
    data.address
  );
  req.input(
    "nearestMrt",
    sql.NVarChar(100),
    data.nearestMrt || null
  );
  req.input(
    "openingHours",
    sql.NVarChar(120),
    data.openingHours || null
  );
  req.input(
    "description",
    sql.NVarChar(500),
    data.description || null
  );
  const result = await req.query(`
    INSERT INTO hawker_centres (
      name,
      town,
      address,
      nearest_mrt,
      opening_hours,
      description
    )
    OUTPUT INSERTED.centre_id
    VALUES (
      @name,
      @town,
      @address,
      @nearestMrt,
      @openingHours,
      @description
    );
  `);
  return findById(
    result.recordset[0].centre_id
  );
}
// Update a hawker centre
async function update(centreId, data) {
  const req = await request();
  req.input(
    "centreId",
    sql.Int,
    centreId
  );
  req.input(
    "name",
    sql.NVarChar(150),
    data.name
  );
  req.input(
    "town",
    sql.NVarChar(80),
    data.town
  );
  req.input(
    "address",
    sql.NVarChar(250),
    data.address
  );
  req.input(
    "nearestMrt",
    sql.NVarChar(100),
    data.nearestMrt || null
  );
  req.input(
    "openingHours",
    sql.NVarChar(120),
    data.openingHours || null
  );
  req.input(
    "description",
    sql.NVarChar(500),
    data.description || null
  );
  await req.query(`
    UPDATE hawker_centres
    SET
      name = @name,
      town = @town,
      address = @address,
      nearest_mrt = @nearestMrt,
      opening_hours = @openingHours,
      description = @description,
      updated_at = SYSUTCDATETIME()
    WHERE centre_id = @centreId;
  `);
  return findById(centreId);
}
// Deactivate a hawker centre
async function remove(centreId) {
  const req = await request();
  req.input(
    "centreId",
    sql.Int,
    centreId
  );
  const result = await req.query(`
    UPDATE hawker_centres
    SET
      is_active = 0,
      updated_at = SYSUTCDATETIME()
    WHERE centre_id = @centreId;
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