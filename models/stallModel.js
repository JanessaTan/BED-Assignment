const {
  sql,
  getPool,
  request,
  pageValues,
  csvToArray
} = require("./modelHelper");
// Select stall information
const columns = `
  s.stall_id AS stallId,
  s.centre_id AS centreId,
  hc.name AS centreName,
  s.name,
  s.unit_number AS unitNumber,
  s.description,
  s.opening_hours AS openingHours,
  s.is_active AS isActive,
  (
    SELECT STRING_AGG(c.name, '|')
    FROM stall_cuisines sc
    JOIN cuisines c ON c.cuisine_id = sc.cuisine_id
    WHERE sc.stall_id = s.stall_id
  ) AS cuisines,
  hi.grade AS hygieneGrade,
  hi.score AS hygieneScore,
  CAST(
    ISNULL(
      (
        SELECT AVG(CAST(f.overall_rating AS DECIMAL(4, 2)))
        FROM feedback f
        WHERE f.stall_id = s.stall_id
      ),
      0
    ) AS DECIMAL(4, 2)
  ) AS averageRating,
  ISNULL(
    (
      SELECT COUNT(*)
      FROM feedback f
      WHERE f.stall_id = s.stall_id
    ),
    0
  ) AS feedbackCount
`;
// Retrieve stalls with filters and pagination
async function list(filters = {}) {
  const { page, limit, offset } = pageValues(filters);
  const req = await request();
  req.input(
    "centreId",
    sql.Int,
    filters.centreId || null
  );
  req.input(
    "cuisineId",
    sql.Int,
    filters.cuisineId || null
  );
  req.input(
    "search",
    sql.NVarChar(100),
    filters.search ? `%${filters.search}%` : null
  );
  req.input(
    "grade",
    sql.Char(1),
    filters.hygieneGrade || null
  );
  req.input("offset", sql.Int, offset);
  req.input("limit", sql.Int, limit);
  const result = await req.query(`
    SELECT
      ${columns},
      COUNT(*) OVER() AS totalCount
    FROM stalls s
    JOIN hawker_centres hc
      ON hc.centre_id = s.centre_id
    OUTER APPLY (
      SELECT TOP (1)
        grade,
        score
      FROM inspections
      WHERE stall_id = s.stall_id
        AND status = 'Completed'
      ORDER BY inspection_date DESC, inspection_id DESC
    ) hi
    WHERE s.is_active = 1
      AND (
        @centreId IS NULL
        OR s.centre_id = @centreId
      )
      AND (
        @search IS NULL
        OR s.name LIKE @search
        OR s.description LIKE @search
      )
      AND (
        @grade IS NULL
        OR hi.grade = @grade
      )
      AND (
        @cuisineId IS NULL
        OR EXISTS (
          SELECT 1
          FROM stall_cuisines
          WHERE stall_id = s.stall_id
            AND cuisine_id = @cuisineId
        )
      )
    ORDER BY s.name
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);
  const total = result.recordset[0]?.totalCount || 0;
  const rows = result.recordset.map(
    ({ totalCount, ...row }) => row
  );
  return {
    rows: csvToArray(rows, "cuisines"),
    page,
    limit,
    total
  };
}
// Find a stall by ID
async function findById(stallId) {
  const req = await request();
  req.input("stallId", sql.Int, stallId);
  const result = await req.query(`
    SELECT ${columns}
    FROM stalls s
    JOIN hawker_centres hc
      ON hc.centre_id = s.centre_id
    OUTER APPLY (
      SELECT TOP (1)
        grade,
        score
      FROM inspections
      WHERE stall_id = s.stall_id
        AND status = 'Completed'
      ORDER BY inspection_date DESC, inspection_id DESC
    ) hi
    WHERE s.stall_id = @stallId;
  `);
  if (!result.recordset[0]) {
    return null;
  }
  return csvToArray(
    result.recordset,
    "cuisines"
  )[0];
}
// Check whether a vendor owns a stall
async function vendorOwns(vendorId, stallId) {
  const req = await request();
  req.input("vendorId", sql.Int, vendorId);
  req.input("stallId", sql.Int, stallId);
  const result = await req.query(`
    SELECT 1 AS owned
    FROM stall_owners
    WHERE vendor_id = @vendorId
      AND stall_id = @stallId
      AND (
        end_date IS NULL
        OR end_date >= CAST(GETDATE() AS DATE)
      );
  `);
  return Boolean(result.recordset[0]);
}
// Check whether an operator manages a stall
async function operatorManages(operatorId, stallId) {
  const req = await request();
  req.input("operatorId", sql.Int, operatorId);
  req.input("stallId", sql.Int, stallId);
  const result = await req.query(`
    SELECT 1 AS managed
    FROM stalls s
    JOIN operator_centres oc
      ON oc.centre_id = s.centre_id
    WHERE s.stall_id = @stallId
      AND oc.user_id = @operatorId;
  `);
  return Boolean(result.recordset[0]);
}
// Save cuisines assigned to a stall
async function saveCuisines(
  transaction,
  stallId,
  cuisineIds
) {
  const deleteRequest = new sql.Request(transaction);
  deleteRequest.input("stallId", sql.Int, stallId);
  await deleteRequest.query(`
    DELETE FROM stall_cuisines
    WHERE stall_id = @stallId;
  `);
  for (
    let index = 0;
    index < (cuisineIds || []).length;
    index += 1
  ) {
    const req = new sql.Request(transaction);
    req.input("stallId", sql.Int, stallId);
    req.input(
      "cuisineId",
      sql.Int,
      cuisineIds[index]
    );
    req.input("primary", sql.Bit, index === 0);
    await req.query(`
      INSERT INTO stall_cuisines (
        stall_id,
        cuisine_id,
        is_primary
      )
      VALUES (
        @stallId,
        @cuisineId,
        @primary
      );
    `);
  }
}
// Create a new stall
async function create(data, vendorId) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = new sql.Request(transaction);
    req.input(
      "centreId",
      sql.Int,
      data.centreId
    );
    req.input(
      "name",
      sql.NVarChar(150),
      data.name
    );
    req.input(
      "unit",
      sql.NVarChar(20),
      data.unitNumber
    );
    req.input(
      "description",
      sql.NVarChar(500),
      data.description || null
    );
    req.input(
      "hours",
      sql.NVarChar(120),
      data.openingHours || null
    );
    const result = await req.query(`
      INSERT INTO stalls (
        centre_id,
        name,
        unit_number,
        description,
        opening_hours
      )
      OUTPUT INSERTED.stall_id
      VALUES (
        @centreId,
        @name,
        @unit,
        @description,
        @hours
      );
    `);
    const stallId = result.recordset[0].stall_id;
    const ownerRequest = new sql.Request(transaction);
    ownerRequest.input("stallId", sql.Int, stallId);
    ownerRequest.input(
      "vendorId",
      sql.Int,
      vendorId
    );
    await ownerRequest.query(`
      INSERT INTO stall_owners (
        stall_id,
        vendor_id,
        start_date
      )
      VALUES (
        @stallId,
        @vendorId,
        CAST(GETDATE() AS DATE)
      );
    `);
    await saveCuisines(
      transaction,
      stallId,
      data.cuisineIds
    );
    await transaction.commit();
    return findById(stallId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
// Update an existing stall
async function update(stallId, data) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = new sql.Request(transaction);
    req.input("stallId", sql.Int, stallId);
    req.input(
      "centreId",
      sql.Int,
      data.centreId
    );
    req.input(
      "name",
      sql.NVarChar(150),
      data.name
    );
    req.input(
      "unit",
      sql.NVarChar(20),
      data.unitNumber
    );
    req.input(
      "description",
      sql.NVarChar(500),
      data.description || null
    );
    req.input(
      "hours",
      sql.NVarChar(120),
      data.openingHours || null
    );
    await req.query(`
      UPDATE stalls
      SET
        centre_id = @centreId,
        name = @name,
        unit_number = @unit,
        description = @description,
        opening_hours = @hours,
        updated_at = SYSUTCDATETIME()
      WHERE stall_id = @stallId;
    `);
    await saveCuisines(
      transaction,
      stallId,
      data.cuisineIds
    );
    await transaction.commit();
    return findById(stallId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
// Deactivate a stall
async function remove(stallId) {
  const req = await request();
  req.input("stallId", sql.Int, stallId);
  const result = await req.query(`
    UPDATE stalls
    SET
      is_active = 0,
      updated_at = SYSUTCDATETIME()
    WHERE stall_id = @stallId;
    SELECT @@ROWCOUNT AS affected;
  `);
  return result.recordset[0].affected;
}
module.exports = {
  list,
  findById,
  vendorOwns,
  operatorManages,
  create,
  update,
  remove
};