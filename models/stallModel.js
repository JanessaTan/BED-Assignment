const { sql, poolPromise } = require('../dbConfig');

// GET all stalls
async function getAllStalls() {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.int, id)
        .query('SELECT * FROM Stall');
    return result.recordset[0];
}

// Get stall by ID
async function getStallById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.int, id)
        .query('SELECT * FROM Stall WHERE StallID = @id');
    return result.recordset[0];
}

// CREATE a new stall
async function createStall(stall) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('StallName', sql.NVarChar, stall.stallName)
        .input('CuisineType', sql.NVarChar, stall.cuisineType)
        .input('CentreID', sql.Int, stall.centreId)
        .input('OwnerID', sql.Int, stall.ownerId)
        .query(`INSERT INTO Stall (StallName, CuisineType, CentreID, OwnerID)
                OUTPUT INSERTED.*
                VALUES (@StallName, @CuisineType, @CentreID, @OwnerID)`);
    return result.recordset[0];
}

// UPDATE an existing stall
async function updateStall(id, stall) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .input('StallName', sql.NVarChar, stall.stallName)
        .input('CuisineType', sql.NVarChar, stall.cuisineType)
        .query(`UPDATE Stall
                SET StallName = @StallName, CuisineType = @CuisineType
                OUTPUT INSERTED.*
                WHERE StallID = @id`);
    return result.recordset[0];
}

// DELETE a stall
async function deleteStall(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('id',sql.Int, id)
        .query('DELETE FROM Stall WHERE StallID = @id');
    return true;
}

module.exports = {getAllStalls, getStallById, createStall, updateStall, deleteStall};