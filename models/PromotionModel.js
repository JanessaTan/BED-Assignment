const sql = require('mssql');
const poolPromise = require('../config/db');

async function generateNextPromoId() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT MAX(CAST(SUBSTRING(PromoID, 2, LEN(PromoID)-1) AS INT)) AS maxNum
    FROM Promotion
  `);
  const maxNum = result.recordset[0].maxNum || 0;
  return 'P' + String(maxNum + 1).padStart(3, '0');
}

async function getPromotionsByStall(stallId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('stallId', sql.VarChar(4), stallId)
    .query(`SELECT * FROM Promotion WHERE StallID = @stallId ORDER BY PromoStartDate DESC`);
  return result.recordset;
}

// US-C8 support — only promotions currently running for this stall.
async function getActivePromotionsByStall(stallId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('stallId', sql.VarChar(4), stallId)
    .query(`
      SELECT * FROM Promotion
      WHERE StallID = @stallId
        AND GETDATE() BETWEEN PromoStartDate AND PromoEndDate
      ORDER BY PromoEndDate ASC
    `);
  return result.recordset;
}

async function getPromotionById(promoId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('promoId', sql.VarChar(4), promoId)
    .query(`SELECT * FROM Promotion WHERE PromoID = @promoId`);
  return result.recordset[0];
}

async function getAllActivePromotions() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT p.*, s.StallName
    FROM Promotion p
    JOIN FoodStall s ON p.StallID = s.StallID
    WHERE GETDATE() BETWEEN p.PromoStartDate AND p.PromoEndDate
    ORDER BY p.PromoEndDate ASC
  `);
  return result.recordset;
}

async function createPromotion({ stallId, promoDesc, promoStartDate, promoEndDate }) {
  const pool = await poolPromise;
  const promoId = await generateNextPromoId();
  await pool.request()
    .input('promoId', sql.VarChar(4), promoId)
    .input('promoDesc', sql.VarChar(50), promoDesc)
    .input('promoStartDate', sql.SmallDateTime, promoStartDate)
    .input('promoEndDate', sql.SmallDateTime, promoEndDate)
    .input('stallId', sql.VarChar(4), stallId)
    .query(`
      INSERT INTO Promotion (PromoID, PromoDesc, PromoStartDate, PromoEndDate, StallID)
      VALUES (@promoId, @promoDesc, @promoStartDate, @promoEndDate, @stallId)
    `);
  return { promoId, stallId };
}

async function updatePromotion(promoId, { promoDesc, promoStartDate, promoEndDate }) {
  const pool = await poolPromise;
  await pool.request()
    .input('promoId', sql.VarChar(4), promoId)
    .input('promoDesc', sql.VarChar(50), promoDesc)
    .input('promoStartDate', sql.SmallDateTime, promoStartDate)
    .input('promoEndDate', sql.SmallDateTime, promoEndDate)
    .query(`
      UPDATE Promotion
      SET PromoDesc = @promoDesc, PromoStartDate = @promoStartDate, PromoEndDate = @promoEndDate
      WHERE PromoID = @promoId
    `);
}

async function deletePromotion(promoId) {
  const pool = await poolPromise;
  await pool.request()
    .input('promoId', sql.VarChar(4), promoId)
    .query(`DELETE FROM Promotion WHERE PromoID = @promoId`);
}

// Same ownership check as menuModel.js — duplicated here (rather than
// imported) so this module stays self-contained like your teammates' files.
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
  getPromotionsByStall,
  getActivePromotionsByStall,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  isStallOwnedBy,
};