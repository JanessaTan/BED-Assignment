/* const database = require("./config/database");

module.exports = {
  sql: database.sql,
  getPool: database.getPool,
  poolPromise: {
    then(resolve, reject) {
      return database.getPool().then(resolve, reject);
    }
  }
}; */

const sql = require('mssql');

const config = {
    user: 'hcms_user',
    password: 'Password123!',
    server: 'localhost',
    database: 'HawkerCentreManagementSystem',
    options: {
        port: 1433,
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
