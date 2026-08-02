const { sql, poolPromise } = require('../dbConfig');

// US-O3: Viewing Hygiene Grade of Stalls (Operator-wide overview)
// Note: this is deliberately different scope from hygieneModel.js's
// getCurrentHygiene(stallId), which looks up ONE stall's latest grade.
// This feature gives the Operator a full listing across every stall.

// GET the latest hygiene grade for every stall (joined with FoodStall for names)
async function getAllStallHygieneGrades() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT fs.StallID, fs.StallName, i.InspectionDate, i.HygieneGrade, i.GradeExpiry
            FROM FoodStall fs
            LEFT JOIN Inspection i ON i.StallID = fs.StallID
            WHERE i.InspectionID IS NULL OR i.InspectionDate = (
                SELECT MAX(i2.InspectionDate)
                FROM Inspection i2
                WHERE i2.StallID = fs.StallID
            )
            ORDER BY fs.StallID
        `);
    return result.recordset;
}

// GET full inspection history (all grades over time) for a specific stall
async function getHygieneHistoryByStall(stallId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('stallId', sql.VarChar, stallId)
        .query('SELECT * FROM Inspection WHERE StallID = @stallId ORDER BY InspectionDate DESC');
    return result.recordset;
}

// GET all stalls currently holding a specific grade, e.g. all 'D' graded stalls
async function getStallsByGrade(grade) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('grade', sql.Char(1), grade)
        .query(`
            SELECT fs.StallID, fs.StallName, i.InspectionDate, i.HygieneGrade, i.GradeExpiry
            FROM FoodStall fs
            JOIN Inspection i ON i.StallID = fs.StallID
            WHERE i.HygieneGrade = @grade
            AND i.InspectionDate = (
                SELECT MAX(i2.InspectionDate)
                FROM Inspection i2
                WHERE i2.StallID = fs.StallID
            )
        `);
    return result.recordset;
}

module.exports = {
    getAllStallHygieneGrades,
    getHygieneHistoryByStall,
    getStallsByGrade
};