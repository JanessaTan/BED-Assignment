const sql = require('mssql');
require('dotenv').config();

const config = {
    user: "HCMS_user",
    password: "123456",
    server: "localhost",
    database: "HawkerCentreManagementSystem",
    options: {
        port: parseInt(process.env.DB_PORT) || 1433,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        throw err;
    });

module.exports = { sql, poolPromise };