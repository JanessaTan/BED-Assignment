const { sql, poolPromise } = require('../dbConfig');
 
// Find a vendor (stall owner) by email - used during login only.
// There is deliberately no createVendor() reachable from a public route:
// vendor accounts are provisioned directly by the admin/operator (e.g. via
// the ALTER/UPDATE script, or a future admin-only endpoint).
async function getVendorByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM StallOwner WHERE OwnerEmail = @email');
    return result.recordset[0];
}
 
module.exports = { getVendorByEmail };
 
