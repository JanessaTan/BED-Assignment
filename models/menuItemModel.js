const {
  sql,
  getPool,
  request,
  pageValues
} = require("./modelHelpers");
// Select menu item information
const columns = `
  mi.menu_item_id AS menuItemId,
  mi.stall_id AS stallId,
  s.name AS stallName,
  s.centre_id AS centreId,
  mi.name,
  mi.category,
  mi.description,
  mi.price,
  mi.preparation_minutes AS preparationMinutes,
  mi.is_available AS isAvailable,
  (
    SELECT STRING_AGG(c.name, '|')
    FROM menu_item_cuisines mic
    JOIN cuisines c
      ON c.cuisine_id = mic.cuisine_id
    WHERE mic.menu_item_id = mi.menu_item_id
  ) AS cuisineNames,
  (
    SELECT STRING_AGG(
      CAST(mic.cuisine_id AS VARCHAR(12)),
      '|'
    )
    FROM menu_item_cuisines mic
    WHERE mic.menu_item_id = mi.menu_item_id
  ) AS cuisineIds,
  (
    SELECT COUNT(*)
    FROM menu_item_likes ml
    WHERE ml.menu_item_id = mi.menu_item_id
  ) AS likeCount
`;
// Convert database values
function normalise(row) {
  return {
    ...row,
    price: Number(row.price),
    cuisines: row.cuisineNames
      ? row.cuisineNames.split("|")
      : [],
    cuisineIds: row.cuisineIds
      ? row.cuisineIds.split("|").map(Number)
      : []
  };
}
// Retrieve available add-ons
async function addOns(menuItemId) {
  const req = await request();
  req.input(
    "menuItemId",
    sql.Int,
    menuItemId
  );
  const result = await req.query(`
    SELECT
      add_on_id AS addOnId,
      name,
      price,
      is_available AS isAvailable
    FROM menu_add_ons
    WHERE menu_item_id = @menuItemId
      AND is_available = 1
    ORDER BY name;
  `);
  return result.recordset.map((row) => ({
    ...row,
    price: Number(row.price)
  }));
}
// Retrieve menu items
async function list(filters = {}) {
  const { page, limit, offset } =
    pageValues(filters);
  const req = await request();
  req.input(
    "stallId",
    sql.Int,
    filters.stallId || null
  );
  req.input(
    "cuisineId",
    sql.Int,
    filters.cuisineId || null
  );
  req.input(
    "search",
    sql.NVarChar(100),
    filters.search
      ? `%${filters.search}%`
      : null
  );
  req.input(
    "category",
    sql.NVarChar(60),
    filters.category || null
  );
  req.input(
    "available",
    sql.Bit,
    filters.available === undefined
      ? null
      : filters.available
  );
  req.input("offset", sql.Int, offset);
  req.input("limit", sql.Int, limit);
  const sort =
    filters.sort === "price_asc"
      ? "mi.price ASC"
      : filters.sort === "price_desc"
        ? "mi.price DESC"
        : filters.sort === "name"
          ? "mi.name ASC"
          : "likeCount DESC, mi.name ASC";
  const result = await req.query(`
    SELECT
      ${columns},
      COUNT(*) OVER() AS totalCount
    FROM menu_items mi
    JOIN stalls s
      ON s.stall_id = mi.stall_id
    WHERE s.is_active = 1
      AND (
        @stallId IS NULL
        OR mi.stall_id = @stallId
      )
      AND (
        @search IS NULL
        OR mi.name LIKE @search
        OR mi.description LIKE @search
      )
      AND (
        @category IS NULL
        OR mi.category = @category
      )
      AND (
        @available IS NULL
        OR mi.is_available = @available
      )
      AND (
        @cuisineId IS NULL
        OR EXISTS (
          SELECT 1
          FROM menu_item_cuisines
          WHERE menu_item_id =
            mi.menu_item_id
            AND cuisine_id = @cuisineId
        )
      )
    ORDER BY ${sort}
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);
  const total =
    result.recordset[0]?.totalCount || 0;
  const rows = [];
  for (const raw of result.recordset) {
    const { totalCount, ...row } = raw;
    rows.push({
      ...normalise(row),
      addOns: await addOns(row.menuItemId)
    });
  }
  return {
    rows,
    page,
    limit,
    total
  };
}
// Find a menu item by ID
async function findById(menuItemId) {
  const req = await request();
  req.input(
    "menuItemId",
    sql.Int,
    menuItemId
  );
  const result = await req.query(`
    SELECT ${columns}
    FROM menu_items mi
    JOIN stalls s
      ON s.stall_id = mi.stall_id
    WHERE mi.menu_item_id = @menuItemId;
  `);
  const row = result.recordset[0];
  return row
    ? {
        ...normalise(row),
        addOns: await addOns(menuItemId)
      }
    : null;
}
// Save cuisines and add-ons
async function saveChildren(
  transaction,
  menuItemId,
  data
) {
  const removeRequest =
    new sql.Request(transaction);
  removeRequest.input(
    "menuItemId",
    sql.Int,
    menuItemId
  );
  await removeRequest.query(`
    DELETE FROM menu_item_cuisines
    WHERE menu_item_id = @menuItemId;
    DELETE FROM menu_add_ons
    WHERE menu_item_id = @menuItemId;
  `);
  const cuisineIds = [
    ...new Set(data.cuisineIds)
  ];
  for (const cuisineId of cuisineIds) {
    const req = new sql.Request(transaction);
    req.input(
      "menuItemId",
      sql.Int,
      menuItemId
    );
    req.input(
      "cuisineId",
      sql.Int,
      cuisineId
    );
    await req.query(`
      INSERT INTO menu_item_cuisines (
        menu_item_id,
        cuisine_id
      )
      VALUES (
        @menuItemId,
        @cuisineId
      );
    `);
  }
  for (const addOn of data.addOns || []) {
    const req = new sql.Request(transaction);
    req.input(
      "menuItemId",
      sql.Int,
      menuItemId
    );
    req.input(
      "name",
      sql.NVarChar(100),
      addOn.name
    );
    req.input(
      "price",
      sql.Decimal(10, 2),
      addOn.price
    );
    await req.query(`
      INSERT INTO menu_add_ons (
        menu_item_id,
        name,
        price
      )
      VALUES (
        @menuItemId,
        @name,
        @price
      );
    `);
  }
}
// Bind menu item values
function bind(req, data) {
  return req
    .input("stallId", sql.Int, data.stallId)
    .input(
      "name",
      sql.NVarChar(150),
      data.name
    )
    .input(
      "category",
      sql.NVarChar(60),
      data.category
    )
    .input(
      "description",
      sql.NVarChar(600),
      data.description
    )
    .input(
      "price",
      sql.Decimal(10, 2),
      data.price
    )
    .input(
      "prep",
      sql.Int,
      data.preparationMinutes
    )
    .input(
      "available",
      sql.Bit,
      data.isAvailable
    );
}
// Create a menu item
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
      INSERT INTO menu_items (
        stall_id,
        name,
        category,
        description,
        price,
        preparation_minutes,
        is_available
      )
      OUTPUT INSERTED.menu_item_id
      VALUES (
        @stallId,
        @name,
        @category,
        @description,
        @price,
        @prep,
        @available
      );
    `);
    const menuItemId =
      result.recordset[0].menu_item_id;
    await saveChildren(
      transaction,
      menuItemId,
      data
    );
    await transaction.commit();
    return findById(menuItemId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
// Update a menu item
async function update(menuItemId, data) {
  const pool = await getPool();
  const transaction =
    new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = bind(
      new sql.Request(transaction),
      data
    );
    req.input(
      "menuItemId",
      sql.Int,
      menuItemId
    );
    await req.query(`
      UPDATE menu_items
      SET
        stall_id = @stallId,
        name = @name,
        category = @category,
        description = @description,
        price = @price,
        preparation_minutes = @prep,
        is_available = @available,
        updated_at = SYSUTCDATETIME()
      WHERE menu_item_id = @menuItemId;
    `);
    await saveChildren(
      transaction,
      menuItemId,
      data
    );
    await transaction.commit();
    return findById(menuItemId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
// Make a menu item unavailable
async function remove(menuItemId) {
  const req = await request();
  req.input(
    "menuItemId",
    sql.Int,
    menuItemId
  );
  const result = await req.query(`
    UPDATE menu_items
    SET
      is_available = 0,
      updated_at = SYSUTCDATETIME()
    WHERE menu_item_id = @menuItemId;
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