const database = require("./config/database");

module.exports = {
  sql: database.sql,
  getPool: database.getPool,
  poolPromise: {
    then(resolve, reject) {
      return database.getPool().then(resolve, reject);
    }
  }
};
