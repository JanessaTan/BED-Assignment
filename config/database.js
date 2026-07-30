const sql = require("mssql");

const REQUIRED_ENV = [
  "DB_SERVER",
  "DB_DATABASE",
  "DB_USER",
  "DB_PASSWORD"
];

let pool;
let poolPromise;

function readBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function buildConfig() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length) {
    const error = new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and add your local values.`
    );
    error.code = "CONFIG_ERROR";
    throw error;
  }

  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number.parseInt(process.env.DB_PORT || "1433", 10),
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: readBoolean(process.env.DB_ENCRYPT, false),
      trustServerCertificate: readBoolean(
        process.env.DB_TRUST_SERVER_CERTIFICATE,
        true
      )
    }
  };
}

async function getPool() {
  if (pool?.connected) return pool;

  if (!poolPromise) {
    pool = new sql.ConnectionPool(buildConfig());
    poolPromise = pool.connect().catch((error) => {
      pool = undefined;
      poolPromise = undefined;
      throw error;
    });
  }

  return poolPromise;
}

async function testConnection() {
  const activePool = await getPool();
  const result = await activePool.request().query(`
    SELECT
      DB_NAME() AS DatabaseName,
      CASE
        WHEN OBJECT_ID('dbo.UserAccount', 'U') IS NOT NULL
         AND OBJECT_ID('dbo.UserRole', 'U') IS NOT NULL
         AND COL_LENGTH('dbo.MenuItem', 'MenuItemID') IS NOT NULL
         AND COL_LENGTH('dbo.Promotion', 'PromotionID') IS NOT NULL
        THEN 1 ELSE 0
      END AS Stage1Ready
  `);

  const status = result.recordset[0];
  if (
    status.DatabaseName !== "HawkerCentreManagementSystem" ||
    status.Stage1Ready !== 1
  ) {
    const error = new Error(
      "The configured database is not the verified Stage 1 HawkerCentreManagementSystem database."
    );
    error.code = "SCHEMA_ERROR";
    throw error;
  }

  return status;
}

async function closePool() {
  if (pool) await pool.close();
  pool = undefined;
  poolPromise = undefined;
}

module.exports = {
  sql,
  buildConfig,
  getPool,
  testConnection,
  closePool
};
