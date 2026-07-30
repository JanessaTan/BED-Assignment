const { sql, getPool } = require("../config/database");
const cuisineModel = require("./cuisineModel");
const AppError = require("../utils/AppError");

const ITEM_SELECT = `
  m.MenuItemID AS itemId,
  m.StallID AS stallId,
  m.ItemCode AS itemCode,
  m.ItemDesc AS itemName,
  m.ItemDetails AS description,
  CAST(m.ItemPrice AS DECIMAL(10, 2)) AS price,
  m.ItemCategory AS category,
  m.ImageURL AS imageUrl,
  m.IsAvailable AS isAvailable,
  m.IsActive AS isActive,
  m.IsVegetarian AS isVegetarian,
  m.DietaryInfo AS dietaryInfo,
  m.CreatedAt AS createdAt,
  m.UpdatedAt AS updatedAt,
  fs.StallName AS stallName,
  (
    SELECT c.CuisineID AS cuisineId, c.CuisineDesc AS name
    FROM dbo.MenuItemCuisine mc
    INNER JOIN dbo.Cuisine c ON c.CuisineID = mc.CuisineID
    WHERE mc.StallID = m.StallID AND mc.ItemCode = m.ItemCode
    ORDER BY c.CuisineDesc
    FOR JSON PATH
  ) AS cuisinesJson
`;

function normalizeItem(row) {
  if (!row) return null;
  const { cuisinesJson, totalCount, ...item } = row;
  return {
    ...item,
    price: Number(item.price),
    cuisines: cuisinesJson ? JSON.parse(cuisinesJson) : []
  };
}

async function list(filters, options = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];
  const publicOnly = options.publicOnly !== false;

  if (publicOnly) {
    where.push("m.IsActive = 1", "m.IsAvailable = 1");
  } else if (filters.availability && filters.availability !== "all") {
    request.input(
      "isAvailable",
      sql.Bit,
      filters.availability === "available"
    );
    where.push("m.IsAvailable = @isAvailable");
  }

  if (filters.ownerId) {
    request.input("ownerId", sql.VarChar(5), filters.ownerId);
    where.push(`
      EXISTS (
        SELECT 1
        FROM dbo.RentalAgreement ra
        WHERE ra.StallID = m.StallID
          AND ra.OwnerID = @ownerId
          AND (ra.AgrStartDate IS NULL OR ra.AgrStartDate <= GETDATE())
          AND (ra.AgrEndDate IS NULL OR ra.AgrEndDate >= GETDATE())
      )
    `);
  }
  if (filters.search) {
    request.input("search", sql.NVarChar(102), `%${filters.search}%`);
    where.push("m.ItemDesc LIKE @search");
  }
  if (filters.stallId) {
    request.input("stallId", sql.VarChar(4), filters.stallId);
    where.push("m.StallID = @stallId");
  }
  if (filters.category) {
    request.input("category", sql.NVarChar(50), filters.category);
    where.push("m.ItemCategory = @category");
  }
  if (filters.cuisineId) {
    request.input("cuisineId", sql.VarChar(10), filters.cuisineId);
    where.push(`
      EXISTS (
        SELECT 1 FROM dbo.MenuItemCuisine filterCuisine
        WHERE filterCuisine.StallID = m.StallID
          AND filterCuisine.ItemCode = m.ItemCode
          AND filterCuisine.CuisineID = @cuisineId
      )
    `);
  }

  const sortColumns = { name: "m.ItemDesc", price: "m.ItemPrice" };
  const sortColumn = sortColumns[filters.sortBy] || sortColumns.name;
  const sortDirection = filters.sortDir === "desc" ? "DESC" : "ASC";
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  request.input("offset", sql.Int, (page - 1) * limit);
  request.input("limit", sql.Int, limit);

  const result = await request.query(`
    SELECT ${ITEM_SELECT}, COUNT(*) OVER() AS totalCount
    FROM dbo.MenuItem m
    INNER JOIN dbo.FoodStall fs ON fs.StallID = m.StallID
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${sortColumn} ${sortDirection}, m.MenuItemID
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const total = result.recordset[0]?.totalCount || 0;
  return {
    items: result.recordset.map(normalizeItem),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function findById(itemId, includeInactive = false) {
  const pool = await getPool();
  const request = pool.request().input("itemId", sql.Int, itemId);
  const result = await request.query(`
    SELECT ${ITEM_SELECT}
    FROM dbo.MenuItem m
    INNER JOIN dbo.FoodStall fs ON fs.StallID = m.StallID
    WHERE m.MenuItemID = @itemId
      ${includeInactive ? "" : "AND m.IsActive = 1 AND m.IsAvailable = 1"}
  `);
  return normalizeItem(result.recordset[0]);
}

async function stallExists(stallId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("stallId", sql.VarChar(4), stallId)
    .query("SELECT 1 AS found FROM dbo.FoodStall WHERE StallID = @stallId");
  return result.recordset.length > 0;
}

async function isStallOwnedBy(stallId, ownerId) {
  if (!ownerId) return false;
  const pool = await getPool();
  const result = await pool
    .request()
    .input("stallId", sql.VarChar(4), stallId)
    .input("ownerId", sql.VarChar(5), ownerId)
    .query(`
      SELECT TOP 1 1 AS found
      FROM dbo.RentalAgreement
      WHERE StallID = @stallId
        AND OwnerID = @ownerId
        AND (AgrStartDate IS NULL OR AgrStartDate <= GETDATE())
        AND (AgrEndDate IS NULL OR AgrEndDate >= GETDATE())
    `);
  return result.recordset.length > 0;
}

async function getOwnedStalls(ownerId) {
  if (!ownerId) return [];
  const pool = await getPool();
  const result = await pool
    .request()
    .input("ownerId", sql.VarChar(5), ownerId)
    .query(`
      SELECT DISTINCT fs.StallID AS stallId, fs.StallName AS stallName
      FROM dbo.RentalAgreement ra
      INNER JOIN dbo.FoodStall fs ON fs.StallID = ra.StallID
      WHERE ra.OwnerID = @ownerId
        AND (ra.AgrStartDate IS NULL OR ra.AgrStartDate <= GETDATE())
        AND (ra.AgrEndDate IS NULL OR ra.AgrEndDate >= GETDATE())
      ORDER BY fs.StallName
    `);
  return result.recordset;
}

async function insertCuisineLinks(transaction, stallId, itemCode, cuisineIds) {
  for (const cuisineId of cuisineIds) {
    await new sql.Request(transaction)
      .input("cuisineId", sql.VarChar(10), cuisineId)
      .input("stallId", sql.VarChar(4), stallId)
      .input("itemCode", sql.VarChar(10), itemCode)
      .query(`
        INSERT INTO dbo.MenuItemCuisine (CuisineID, StallID, ItemCode)
        VALUES (@cuisineId, @stallId, @itemCode)
      `);
  }
}

async function create(data) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const validCuisineCount = await cuisineModel.countActiveByIds(
      data.cuisineIds,
      transaction
    );
    if (validCuisineCount !== data.cuisineIds.length) {
      throw new AppError(400, "One or more cuisine IDs are invalid or inactive");
    }

    const sequenceResult = await new sql.Request(transaction).query(
      "SELECT NEXT VALUE FOR dbo.MenuItemCodeSequence AS nextNumber"
    );
    const itemCode = `I${String(
      sequenceResult.recordset[0].nextNumber
    ).padStart(4, "0")}`;

    const insertResult = await new sql.Request(transaction)
      .input("stallId", sql.VarChar(4), data.stallId)
      .input("itemCode", sql.VarChar(10), itemCode)
      .input("itemName", sql.NVarChar(100), data.itemName)
      .input("description", sql.NVarChar(500), data.description || null)
      .input("price", sql.Decimal(10, 2), data.price)
      .input("category", sql.NVarChar(50), data.category)
      .input("imageUrl", sql.NVarChar(500), data.imageUrl || null)
      .input("isAvailable", sql.Bit, data.isAvailable)
      .input("isVegetarian", sql.Bit, data.isVegetarian)
      .input("dietaryInfo", sql.NVarChar(200), data.dietaryInfo || null)
      .query(`
        INSERT INTO dbo.MenuItem (
          StallID, ItemCode, ItemDesc, ItemDetails, ItemPrice,
          ItemCategory, ImageURL, IsAvailable, IsActive,
          IsVegetarian, DietaryInfo
        )
        OUTPUT INSERTED.MenuItemID
        VALUES (
          @stallId, @itemCode, @itemName, @description, @price,
          @category, @imageUrl, @isAvailable, 1,
          @isVegetarian, @dietaryInfo
        )
      `);

    await insertCuisineLinks(
      transaction,
      data.stallId,
      itemCode,
      data.cuisineIds
    );
    const itemId = insertResult.recordset[0].MenuItemID;
    await transaction.commit();
    return findById(itemId, true);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function update(itemId, data) {
  const existing = await findById(itemId, true);
  if (!existing) return null;

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    if (data.cuisineIds) {
      const validCuisineCount = await cuisineModel.countActiveByIds(
        data.cuisineIds,
        transaction
      );
      if (validCuisineCount !== data.cuisineIds.length) {
        throw new AppError(
          400,
          "One or more cuisine IDs are invalid or inactive"
        );
      }
    }

    const merged = {
      itemName: data.itemName ?? existing.itemName,
      description:
        data.description !== undefined ? data.description : existing.description,
      price: data.price ?? existing.price,
      category: data.category ?? existing.category,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
      isAvailable: data.isAvailable ?? existing.isAvailable,
      isVegetarian: data.isVegetarian ?? existing.isVegetarian,
      dietaryInfo:
        data.dietaryInfo !== undefined
          ? data.dietaryInfo
          : existing.dietaryInfo
    };

    await new sql.Request(transaction)
      .input("itemId", sql.Int, itemId)
      .input("itemName", sql.NVarChar(100), merged.itemName)
      .input("description", sql.NVarChar(500), merged.description || null)
      .input("price", sql.Decimal(10, 2), merged.price)
      .input("category", sql.NVarChar(50), merged.category)
      .input("imageUrl", sql.NVarChar(500), merged.imageUrl || null)
      .input("isAvailable", sql.Bit, merged.isAvailable)
      .input("isVegetarian", sql.Bit, merged.isVegetarian)
      .input("dietaryInfo", sql.NVarChar(200), merged.dietaryInfo || null)
      .query(`
        UPDATE dbo.MenuItem
        SET ItemDesc = @itemName,
            ItemDetails = @description,
            ItemPrice = @price,
            ItemCategory = @category,
            ImageURL = @imageUrl,
            IsAvailable = @isAvailable,
            IsVegetarian = @isVegetarian,
            DietaryInfo = @dietaryInfo,
            UpdatedAt = SYSUTCDATETIME()
        WHERE MenuItemID = @itemId AND IsActive = 1
      `);

    if (data.cuisineIds) {
      await new sql.Request(transaction)
        .input("stallId", sql.VarChar(4), existing.stallId)
        .input("itemCode", sql.VarChar(10), existing.itemCode)
        .query(`
          DELETE FROM dbo.MenuItemCuisine
          WHERE StallID = @stallId AND ItemCode = @itemCode
        `);
      await insertCuisineLinks(
        transaction,
        existing.stallId,
        existing.itemCode,
        data.cuisineIds
      );
    }

    await transaction.commit();
    return findById(itemId, true);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function deactivate(itemId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("itemId", sql.Int, itemId)
    .query(`
      UPDATE dbo.MenuItem
      SET IsActive = 0,
          IsAvailable = 0,
          UpdatedAt = SYSUTCDATETIME()
      WHERE MenuItemID = @itemId AND IsActive = 1
    `);
  return result.rowsAffected[0] > 0;
}

module.exports = {
  list,
  findById,
  stallExists,
  isStallOwnedBy,
  getOwnedStalls,
  create,
  update,
  deactivate,
  normalizeItem
};
