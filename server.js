require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/database");

const port = Number.parseInt(process.env.PORT || "3000", 10);

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be set to a random value containing at least 32 characters."
    );
  }

  const status = await testConnection();
  console.log(
    `Connected to verified database: ${status.DatabaseName} (Stage 1 ready)`
  );

  app.listen(port, () => {
    console.log(`HawkerHub is running at http://localhost:${port}`);
    console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
  });
}

start().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
});
