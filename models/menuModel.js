const sql = require('mssql');
const poolPromise = require('../dbConfig'); // adjust path to match your project

/**
 * MenuItem PK is (StallID, ItemCode) — ItemCode is only unique WITHIN a stall
 * per the schema, but existing seed data treats it as globally unique
 * (I001, I002, ...). We follow that convention when generating new codes.
 */

async function generateNextItemCode() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT MAX(CAST(SUBSTRING(ItemCode, 2, LEN(ItemCode)-1) AS INT)) AS maxNum
    FROM MenuItem
  `);
  const maxNum = result.recordset[0].maxNum || 0;
  return 'I' + String(maxNum + 1).padStart(3, '0');
}

async function getMenuItemsByStall(stallId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('stallId', sql.VarChar(4), stallId)
    .query(`
      SELECT m.StallID, m.ItemCode, m.ItemDesc, m.ItemPrice, m.ItemCategory,
             STRING_AGG(c.CuisineDesc, ', ') AS Cuisines
      FROM MenuItem m
      LEFT JOIN MenuItemCuisine mc ON mc.StallID = m.StallID AND mc.ItemCode = m.ItemCode
      LEFT JOIN Cuisine c ON c.CuisineID = mc.CuisineID
      WHERE m.StallID = @stallId
      GROUP BY m.StallID, m.ItemCode, m.ItemDesc, m.ItemPrice, m.ItemCategory
    `);
  return result.recordset;
}

async function getMenuItemById(stallId, itemCode) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('stallId', sql.VarChar(4), stallId)
    .input('itemCode', sql.VarChar(10), itemCode)
    .query(`SELECT * FROM MenuItem WHERE StallID = @stallId AND ItemCode = @itemCode`);
  return result.recordset[0];
}

async function createMenuItem({ stallId, itemDesc, itemPrice, itemCategory, cuisineIds }) {
  const pool = await poolPromise;
  const itemCode = await generateNextItemCode();

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const request = new sql.Request(transaction);
    await request
      .input('stallId', sql.VarChar(4), stallId)
      .input('itemCode', sql.VarChar(10), itemCode)
      .input('itemDesc', sql.VarChar(100), itemDesc)
      .input('itemPrice', sql.Money, itemPrice)
      .input('itemCategory', sql.VarChar(50), itemCategory)
      .query(`
        INSERT INTO MenuItem (StallID, ItemCode, ItemDesc, ItemPrice, ItemCategory)
        VALUES (@stallId, @itemCode, @itemDesc, @itemPrice, @itemCategory)
      `);

    for (const cuisineId of cuisineIds || []) {
      const cuisineRequest = new sql.Request(transaction);
      await cuisineRequest
        .input('cuisineId', sql.VarChar(10), cuisineId)
        .input('stallId', sql.VarChar(4), stallId)
        .input('itemCode', sql.VarChar(10), itemCode)
        .query(`
          INSERT INTO MenuItemCuisine (CuisineID, StallID, ItemCode)
          VALUES (@cuisineId, @stallId, @itemCode)
        `);
    }

    await transaction.commit();
    return { stallId, itemCode };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updateMenuItem(stallId, itemCode, { itemDesc, itemPrice, itemCategory, cuisineIds }) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const request = new sql.Request(transaction);
    await request
      .input('stallId', sql.VarChar(4), stallId)
      .input('itemCode', sql.VarChar(10), itemCode)
      .input('itemDesc', sql.VarChar(100), itemDesc)
      .input('itemPrice', sql.Money, itemPrice)
      .input('itemCategory', sql.VarChar(50), itemCategory)
      .query(`
        UPDATE MenuItem
        SET ItemDesc = @itemDesc, ItemPrice = @itemPrice, ItemCategory = @itemCategory
        WHERE StallID = @stallId AND ItemCode = @itemCode
      `);

    if (cuisineIds) {
      const clearRequest = new sql.Request(transaction);
      await clearRequest
        .input('stallId', sql.VarChar(4), stallId)
        .input('itemCode', sql.VarChar(10), itemCode)
        .query(`DELETE FROM MenuItemCuisine WHERE StallID = @stallId AND ItemCode = @itemCode`);

      for (const cuisineId of cuisineIds) {
        const cuisineRequest = new sql.Request(transaction);
        await cuisineRequest
          .input('cuisineId', sql.VarChar(10), cuisineId)
          .input('stallId', sql.VarChar(4), stallId)
          .input('itemCode', sql.VarChar(10), itemCode)
          .query(`INSERT INTO MenuItemCuisine (CuisineID, StallID, ItemCode) VALUES (@cuisineId, @stallId, @itemCode)`);
      }
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteMenuItem(stallId, itemCode) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const cuisineRequest = new sql.Request(transaction);
    await cuisineRequest
      .input('stallId', sql.VarChar(4), stallId)
      .input('itemCode', sql.VarChar(10), itemCode)
      .query(`DELETE FROM MenuItemCuisine WHERE StallID = @stallId AND ItemCode = @itemCode`);

    const itemRequest = new sql.Request(transaction);
    await itemRequest
      .input('stallId', sql.VarChar(4), stallId)
      .input('itemCode', sql.VarChar(10), itemCode)
      .query(`DELETE FROM MenuItem WHERE StallID = @stallId AND ItemCode = @itemCode`);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Used by the authorization middleware to confirm a vendor owns the stall
// they're trying to modify — joins through RentalAgreement since there's
// no direct StallOwner -> FoodStall FK.
async function isStallOwnedBy(stallId, ownerId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('stallId', sql.VarChar(4), stallId)
    .input('ownerId', sql.VarChar(5), ownerId)
    .query(`
      SELECT TOP 1 AgreementID FROM RentalAgreement
      WHERE StallID = @stallId AND OwnerID = @ownerId
        AND (AgrEndDate IS NULL OR AgrEndDate >= CAST(GETDATE() AS DATE))
      ORDER BY AgrStartDate DESC
    `);
  return result.recordset.length > 0;
}

module.exports = {
  getMenuItemsByStall,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  isStallOwnedBy,
};
