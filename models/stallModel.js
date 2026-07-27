const { sql, poolPromise } = require('../dbConfig');

// GET all stalls
async function getAllStalls() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query('SELECT * FROM FoodStall');
    return result.recordset;
}

// GET stall by ID
async function getStallById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query('SELECT * FROM FoodStall WHERE StallID = @id');
    return result.recordset[0];
}

// GET all stalls, optionally filtered by hawker centre
async function getAllStalls(hawkerCentreId) {
    const pool = await poolPromise;
    const request = pool.request();

    if (hawkerCentreId) {
        request.input('hawkerCentreId', sql.VarChar, hawkerCentreId);
        const result = await request
            .query('SELECT * FROM FoodStall WHERE HawkerCentreID = @hawkerCentreId');
        return result.recordset;
    }

    const result = await request.query('SELECT * FROM FoodStall');
    return result.recordset;
}

// GET all menu items for a specific stall (US-C1: Browse Food Stalls & Menus)
async function getMenuByStallId(stallId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('stallId', sql.VarChar, stallId)
        .query('SELECT * FROM MenuItem WHERE StallID = @stallId');
    return result.recordset;
}

// Generate the next StallID in sequence, e.g. S032 -> S033
async function getNextStallId() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query('SELECT TOP 1 StallID FROM FoodStall ORDER BY StallID DESC');
    const last = result.recordset[0]?.StallID; // e.g. 'S032'
    const nextNum = last ? parseInt(last.substring(1)) + 1 : 1;
    return 'S' + String(nextNum).padStart(3, '0');
}

// CREATE a new stall
async function createStall(stall) {
    const pool = await poolPromise;
    const newId = await getNextStallId();

    await pool.request()
        .input('StallID', sql.VarChar, newId)
        .input('StallUnitNo', sql.VarChar, stall.stallUnitNo)
        .input('StallName', sql.VarChar, stall.stallName)
        .input('StallDesc', sql.VarChar, stall.stallDesc)
        .input('HawkerCentreID', sql.VarChar, stall.hawkerCentreId)
        .query(`INSERT INTO FoodStall (StallID, StallUnitNo, StallName, StallDesc, HawkerCentreID)
                VALUES (@StallID, @StallUnitNo, @StallName, @StallDesc, @HawkerCentreID)`);

    return { stallId: newId, ...stall };
}

// UPDATE an existing stall
async function updateStall(id, stall) {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.VarChar, id)
        .input('StallName', sql.VarChar, stall.stallName)
        .input('StallDesc', sql.VarChar, stall.stallDesc)
        .query(`UPDATE FoodStall
                SET StallName = @StallName, StallDesc = @StallDesc
                WHERE StallID = @id`);

    return getStallById(id);
}

// DELETE a stall
async function deleteStall(id) {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.VarChar, id)
        .query('DELETE FROM FoodStall WHERE StallID = @id');
    return true;
}

module.exports = { getAllStalls, getStallById, createStall, updateStall, deleteStall, getMenuByStallId };