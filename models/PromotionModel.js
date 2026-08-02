const {
  sql,
  getPool,
  request,
  pageValues
} = require("./modelHelpers");
// Select promotion information
const columns = `
  p.promotion_id AS promotionId,
  p.stall_id AS stallId,
  s.name AS stallName,
  s.centre_id AS centreId,
  hc.name AS centreName,
  p.name,
  p.description,
  p.discount_type AS discountType,
  p.discount_value AS discountValue,
  p.start_date AS startDate,
  p.end_date AS endDate,
  p.is_active AS isActive,
  CASE
    WHEN p.is_active = 1
      AND CAST(GETDATE() AS DATE)
      BETWEEN p.start_date AND p.end_date
    THEN CAST(1 AS BIT)
    ELSE CAST(0 AS BIT)
  END AS currentlyActive,
  (
    SELECT STRING_AGG(
      CAST(menu_item_id AS VARCHAR(12)),
      '|'
    )
    FROM promotion_menu_items
    WHERE promotion_id = p.promotion_id
  ) AS menuItemIds
`;
// Convert database values
function normalise(row) {
  return {
    ...row,
    discountValue: Number(row.discountValue),
    menuItemIds: row.menuItemIds
      ? row.menuItemIds.split("|").map(Number)
      : []
  };
}
// Retrieve promotions
async function list(filters = {}) {
  const { page, limit, offset } = pageValues(filters);
  const req = await request();
  req.input(
    "centreId",
    sql.Int,
    filters.centreId || null
  );
  req.input(
    "stallId",
    sql.Int,
    filters.stallId || null
  );
  req.input(
    "active",
    sql.Bit,
    filters.active === undefined
      ? null
      : filters.active
  );
  req.input("offset", sql.Int, offset);
  req.input("limit", sql.Int, limit);
  const result = await req.query(`
    SELECT
      ${columns},
      COUNT(*) OVER() AS totalCount
    FROM promotions p
    JOIN stalls s
      ON s.stall_id = p.stall_id
    JOIN hawker_centres hc
      ON hc.centre_id = s.centre_id
    WHERE (
      @centreId IS NULL
      OR s.centre_id = @centreId
    )
      AND (
        @stallId IS NULL
        OR p.stall_id = @stallId
      )
      AND (
        @active IS NULL
        OR CASE
          WHEN p.is_active = 1
            AND CAST(GETDATE() AS DATE)
            BETWEEN p.start_date AND p.end_date
          THEN 1
          ELSE 0
        END = @active
      )
    ORDER BY p.start_date DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);
  const total =
    result.recordset[0]?.totalCount || 0;
  const rows = result.recordset.map(
    ({ totalCount, ...row }) => normalise(row)
  );
  return {
    rows,
    page,
    limit,
    total
  };
}
// Find a promotion by ID
async function findById(id) {
  const req = await request();
  req.input("id", sql.Int, id);
  const result = await req.query(`
    SELECT ${columns}
    FROM promotions p
    JOIN stalls s
      ON s.stall_id = p.stall_id
    JOIN hawker_centres hc
      ON hc.centre_id = s.centre_id
    WHERE p.promotion_id = @id;
  `);
  const row = result.recordset[0];
  return row ? normalise(row) : null;
}
// Save promotion menu items
async function saveItems(
  transaction,
  id,
  ids
) {
  const deleteRequest =
    new sql.Request(transaction);
  deleteRequest.input("id", sql.Int, id);
  await deleteRequest.query(`
    DELETE FROM promotion_menu_items
    WHERE promotion_id = @id;
  `);
  const uniqueIds = [...new Set(ids || [])];
  for (const menuItemId of uniqueIds) {
    const req = new sql.Request(transaction);
    req.input("id", sql.Int, id);
    req.input(
      "menuItemId",
      sql.Int,
      menuItemId
    );
    await req.query(`
      INSERT INTO promotion_menu_items (
        promotion_id,
        menu_item_id
      )
      SELECT
        @id,
        @menuItemId
      WHERE EXISTS (
        SELECT 1
        FROM menu_items
        WHERE menu_item_id = @menuItemId
          AND stall_id = (
            SELECT stall_id
            FROM promotions
            WHERE promotion_id = @id
          )
      );
    `);
  }
}
// Bind promotion values
function bind(req, data) {
  return req
    .input("stallId", sql.Int, data.stallId)
    .input(
      "name",
      sql.NVarChar(150),
      data.name
    )
    .input(
      "description",
      sql.NVarChar(500),
      data.description
    )
    .input(
      "type",
      sql.VarChar(12),
      data.discountType
    )
    .input(
      "value",
      sql.Decimal(10, 2),
      data.discountValue
    )
    .input(
      "start",
      sql.Date,
      data.startDate
    )
    .input(
      "end",
      sql.Date,
      data.endDate
    );
}
// Create a promotion
async function create(data) {
  const pool = await getPool();
  const transaction =
    new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = bind(
      new sql.Request(transaction),
      data
    );
    const result = await req.query(`
      INSERT INTO promotions (
        stall_id,
        name,
        description,
        discount_type,
        discount_value,
        start_date,
        end_date
      )
      OUTPUT INSERTED.promotion_id
      VALUES (
        @stallId,
        @name,
        @description,
        @type,
        @value,
        @start,
        @end
      );
    `);
    const id =
      result.recordset[0].promotion_id;
    await saveItems(
      transaction,
      id,
      data.menuItemIds
    );
    await transaction.commit();
    return findById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
// Update a promotion
async function update(id, data) {
  const pool = await getPool();
  const transaction =
    new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = bind(
      new sql.Request(transaction),
      data
    );
    req.input("id", sql.Int, id);
    await req.query(`
      UPDATE promotions
      SET
        stall_id = @stallId,
        name = @name,
        description = @description,
        discount_type = @type,
        discount_value = @value,
        start_date = @start,
        end_date = @end,
        updated_at = SYSUTCDATETIME()
      WHERE promotion_id = @id;
    `);
    await saveItems(
      transaction,
      id,
      data.menuItemIds
    );
    await transaction.commit();
    return findById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
// Deactivate a promotion
async function remove(id) {
  const req = await request();
  req.input("id", sql.Int, id);
  const result = await req.query(`
    UPDATE promotions
    SET
      is_active = 0,
      updated_at = SYSUTCDATETIME()
    WHERE promotion_id = @id;
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