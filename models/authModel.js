const { sql, poolPromise } = require('../dbConfig');

// Find a customer by email (used during registration check and login)
async function getCustomerByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM Customer WHERE CustEmail = @email');
    return result.recordset[0];
}

// Find a customer by ID (useful once logged in, e.g. for profile display)
async function getCustomerById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query('SELECT CustomerID, CustName, CustEmail FROM Customer WHERE CustomerID = @id');
    return result.recordset[0];
}

// Generate the next CustomerID in sequence, e.g. CU040 -> CU041
// (needed because CustomerID is VARCHAR and hand-formatted, not auto-increment)
async function getNextCustomerId() {
    const pool = await poolPromise;
    const result = await pool.request()
        .query('SELECT TOP 1 CustomerID FROM Customer ORDER BY CustomerID DESC');
    const last = result.recordset[0]?.CustomerID; // e.g. 'CU040'
    const nextNum = last ? parseInt(last.substring(2)) + 1 : 1;
    return 'CU' + String(nextNum).padStart(3, '0');
}

// Create a new customer account (password should already be hashed before calling this)
async function createCustomer(name, email, hashedPassword) {
    const pool = await poolPromise;
    const newId = await getNextCustomerId();

    await pool.request()
        .input('CustomerID', sql.VarChar, newId)
        .input('CustName', sql.VarChar, name)
        .input('CustEmail', sql.VarChar, email)
        .input('Password', sql.VarChar, hashedPassword)
        .query(`INSERT INTO Customer (CustomerID, CustNRIC, CustName, CustEmail, Password)
                VALUES (@CustomerID, 'PENDING', @CustName, @CustEmail, @Password)`);

    return { customerId: newId, name, email };
}

module.exports = { getCustomerByEmail, getCustomerById, createCustomer };
