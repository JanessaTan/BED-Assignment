const { sql, poolPromise } = require('../dbConfig');

// Note: there is no dedicated Complaint table in the schema (it's commented out
// in HCMS.sql). Complaints are recorded in the Feedback table where
// Category = 'Complaint'.

// GET all complaints (US-O2: Operator views all customer complaints)
async function getAllComplaints() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT * FROM Feedback WHERE Category = 'Complaint' ORDER BY FbkDateTime DESC`);
    return result.recordset;
}

// GET a single complaint by ID
async function getComplaintById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query(`SELECT * FROM Feedback WHERE FbkID = @id AND Category = 'Complaint'`);
    return result.recordset[0];
}

// GET all complaints against a specific stall
async function getComplaintsByStall(stallId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('stallId', sql.VarChar, stallId)
        .query(`SELECT * FROM Feedback WHERE StallID = @stallId AND Category = 'Complaint' ORDER BY FbkDateTime DESC`);
    return result.recordset;
}

// GET all complaints filed by a specific customer
async function getComplaintsByCustomer(customerId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('customerId', sql.VarChar, customerId)
        .query(`SELECT * FROM Feedback WHERE CustomerID = @customerId AND Category = 'Complaint' ORDER BY FbkDateTime DESC`);
    return result.recordset;
}

module.exports = {
    getAllComplaints,
    getComplaintById,
    getComplaintsByStall,
    getComplaintsByCustomer
};