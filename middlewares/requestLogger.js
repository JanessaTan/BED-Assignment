const morgan = require("morgan");

// Use detailed logs in production and short logs during development
module.exports = morgan(
  process.env.NODE_ENV === "production"
    ? "combined"
    : "dev"
);
