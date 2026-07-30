const { sql, getPool } = require("../config/database");

const PROMOTION_SELECT = `
  p.PromotionID AS promotionId,
  p.PromoID AS promotionCode,
  p.PromotionName AS promotionName,
  p.PromoDesc AS description,
  p.PromoStartDate AS startDate,
  p.PromoEndDate AS endDate,
  p.StallID AS stallId,
  fs.StallName AS stallName,
  p.ItemCode AS itemCode,
  m.MenuItemID AS itemId,
  m.ItemDesc AS itemName,
  CAST(m.ItemPrice AS DECIMAL(10, 2)) AS originalPrice,
  p.DiscountType AS discountType,
  CAST(p.DiscountValue AS DECIMAL(10, 2)) AS discountValue,
  p.IsActive AS isActive,
  p.CreatedAt AS createdAt,
  p.UpdatedAt AS updatedAt
`;

function normalizePromotion(row) {
  if (!row) return null;
  const { totalCount, ...promotion } = row;
  return {
    ...promotion,
    originalPrice:
      promotion.originalPrice === null ? null : Number(promotion.originalPrice),
    discountValue:
      promotion.discountValue === null ? null : Number(promotion.discountValue)
  };
}

const joins = `
  INNER JOIN dbo.FoodStall fs ON fs.StallID = p.StallID
  LEFT JOIN dbo.MenuItem m
    ON m.StallID = p.StallID AND m.ItemCode = p.ItemCode
`;

async function listActive(filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  const where = [
    "p.IsActive = 1",
    "p.PromoStartDate <= SYSUTCDATETIME()",
    "p.PromoEndDate >= SYSUTCDATETIME()"
  ];

  if (filters.stallId) {
    request.input("stallId", sql.VarChar(4), filters.stallId);
    where.push("p.StallID = @stallId");
  }
  if (filters.itemId) {
    request.input("itemId", sql.Int, filters.itemId);
    where.push("m.MenuItemID = @itemId");
  }

  const page = filters.page || 1;
  const limit = filters.limit || 12;
  request.input("offset", sql.Int, (page - 1) * limit);
  request.input("limit", sql.Int, limit);

  const result = await request.query(`
    SELECT ${PROMOTION_SELECT}, COUNT(*) OVER() AS totalCount
    FROM dbo.Promotion p
    ${joins}
    WHERE ${where.join(" AND ")}
    ORDER BY p.PromoEndDate, p.PromotionID
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const total = result.recordset[0]?.totalCount || 0;
  return {
    promotions: result.recordset.map(normalizePromotion),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function listMine(ownerId, filters = {}) {
  const pool = await getPool();
  const request = pool
    .request()
    .input("ownerId", sql.VarChar(5), ownerId);
  const where = [`
    EXISTS (
      SELECT 1
      FROM dbo.RentalAgreement ra
      WHERE ra.StallID = p.StallID
        AND ra.OwnerID = @ownerId
        AND (ra.AgrStartDate IS NULL OR ra.AgrStartDate <= GETDATE())
        AND (ra.AgrEndDate IS NULL OR ra.AgrEndDate >= GETDATE())
    )
  `];
  if (filters.stallId) {
    request.input("stallId", sql.VarChar(4), filters.stallId);
    where.push("p.StallID = @stallId");
  }

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  request.input("offset", sql.Int, (page - 1) * limit);
  request.input("limit", sql.Int, limit);

  const result = await request.query(`
    SELECT ${PROMOTION_SELECT}, COUNT(*) OVER() AS totalCount
    FROM dbo.Promotion p
    ${joins}
    WHERE ${where.join(" AND ")}
    ORDER BY p.IsActive DESC, p.PromoStartDate DESC, p.PromotionID DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);
  const total = result.recordset[0]?.totalCount || 0;
  return {
    promotions: result.recordset.map(normalizePromotion),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function findById(promotionId, activeOnly = false) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("promotionId", sql.Int, promotionId)
    .query(`
      SELECT ${PROMOTION_SELECT}
      FROM dbo.Promotion p
      ${joins}
      WHERE p.PromotionID = @promotionId
        ${
          activeOnly
            ? "AND p.IsActive = 1 AND p.PromoStartDate <= SYSUTCDATETIME() AND p.PromoEndDate >= SYSUTCDATETIME()"
            : ""
        }
    `);
  return normalizePromotion(result.recordset[0]);
}

async function activeForStalls(stallIds) {
  if (!stallIds.length) return [];
  const pool = await getPool();
  const request = pool.request();
  const parameters = stallIds.map((stallId, index) => {
    request.input(`stall${index}`, sql.VarChar(4), stallId);
    return `@stall${index}`;
  });
  const result = await request.query(`
    SELECT ${PROMOTION_SELECT}
    FROM dbo.Promotion p
    ${joins}
    WHERE p.IsActive = 1
      AND p.PromoStartDate <= SYSUTCDATETIME()
      AND p.PromoEndDate >= SYSUTCDATETIME()
      AND p.StallID IN (${parameters.join(", ")})
  `);
  return result.recordset.map(normalizePromotion);
}

async function create(data) {
  const pool = await getPool();
  const sequenceResult = await pool
    .request()
    .query("SELECT NEXT VALUE FOR dbo.PromotionCodeSequence AS nextNumber");
  const promotionCode = `P${String(
    sequenceResult.recordset[0].nextNumber
  ).padStart(3, "0")}`;

  const result = await pool
    .request()
    .input("promotionCode", sql.VarChar(4), promotionCode)
    .input("promotionName", sql.NVarChar(100), data.promotionName)
    .input("description", sql.NVarChar(500), data.description || null)
    .input("startDate", sql.DateTime2(0), data.startDate)
    .input("endDate", sql.DateTime2(0), data.endDate)
    .input("stallId", sql.VarChar(4), data.stallId)
    .input("itemCode", sql.VarChar(10), data.itemCode || null)
    .input("discountType", sql.VarChar(20), data.discountType)
    .input("discountValue", sql.Decimal(10, 2), data.discountValue)
    .query(`
      INSERT INTO dbo.Promotion (
        PromoID, PromotionName, PromoDesc, PromoStartDate, PromoEndDate,
        StallID, ItemCode, DiscountType, DiscountValue, IsActive
      )
      OUTPUT INSERTED.PromotionID
      VALUES (
        @promotionCode, @promotionName, @description, @startDate, @endDate,
        @stallId, @itemCode, @discountType, @discountValue, 1
      )
    `);
  return findById(result.recordset[0].PromotionID);
}

async function update(promotionId, data) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("promotionId", sql.Int, promotionId)
    .input("promotionName", sql.NVarChar(100), data.promotionName)
    .input("description", sql.NVarChar(500), data.description || null)
    .input("startDate", sql.DateTime2(0), data.startDate)
    .input("endDate", sql.DateTime2(0), data.endDate)
    .input("itemCode", sql.VarChar(10), data.itemCode || null)
    .input("discountType", sql.VarChar(20), data.discountType)
    .input(
      "discountValue",
      sql.Decimal(10, 2),
      data.discountValue === null ? null : data.discountValue
    )
    .input("isActive", sql.Bit, data.isActive)
    .query(`
      UPDATE dbo.Promotion
      SET PromotionName = @promotionName,
          PromoDesc = @description,
          PromoStartDate = @startDate,
          PromoEndDate = @endDate,
          ItemCode = @itemCode,
          DiscountType = @discountType,
          DiscountValue = @discountValue,
          IsActive = @isActive,
          UpdatedAt = SYSUTCDATETIME()
      WHERE PromotionID = @promotionId
    `);
  if (!result.rowsAffected[0]) return null;
  return findById(promotionId);
}

async function deactivate(promotionId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("promotionId", sql.Int, promotionId)
    .query(`
      UPDATE dbo.Promotion
      SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
      WHERE PromotionID = @promotionId AND IsActive = 1
    `);
  return result.rowsAffected[0] > 0;
}

module.exports = {
  listActive,
  listMine,
  findById,
  activeForStalls,
  create,
  update,
  deactivate,
  normalizePromotion
};
