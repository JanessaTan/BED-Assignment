module.exports = {
  user: "hygienerecord_user",
  password: "123456",
  server: "localhost",
  database: "HawkerCentreHygieneRating",
  trustServerCertificate: true,
  options: {
    port: 1433, // Default SQL Server port
    connectionTimeout: 60000, // Connection timeout in milliseconds
  },
};

// const sql = require('mssql');
// require('dotenv').config();

// const config = {
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     server: process.env.DB_SERVER,
//     database: process.env.DB_NAME,

// };

// const poolPromise = new sql.ConnectionPool(config)
//     .connect()
//     .then(pool => {
//         console.log('Connected to SQL Server');
//         return pool;
//     })
//     .catch(err => {
//         console.error('Database connection failed:',err);
//         throw err;
//     });

// module.exports = { sql, poolPromise };    
