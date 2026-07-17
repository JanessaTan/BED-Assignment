const { sql, poolPromise } = require('../.config/db');

// Find a customer by email (used during registration check and login)
async function getCustomerByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT * FROM Customer WHERE Email = @email');
    return result.recordset[0];
}

// Find a customer by ID (useful once logged in, e.g. for profile display)
async function getCustomerById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT CustomerID, Name, Email FROM Customer WHERE CustomerID = @id');
    return result.recordset[0];
}

// Create a new customer account (password should already be hashed before calling this)
async function createCustomer(name, email, hashedPassword) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('Name', sql.NVarChar, name)
        .input('Email', sql.NVarChar, email)
        .input('Password', sql.NVarChar, hashedPassword)
        .query(`INSERT INTO Customer (Name, Email, Password)
                OUTPUT INSERTED.CustomerID, INSERTED.Name, INSERTED.Email
                VALUES (@Name, @Email, @Password)`);
    return result.recordset[0];
}

module.exports = { getCustomerByEmail, getCustomerById, createCustomer };