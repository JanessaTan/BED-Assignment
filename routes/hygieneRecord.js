const express = require("express");
const sql = require("mssql"); // Assuming you've installed mssql
const dbConfig = require("./dbConfig");

const app = express();
const port = process.env.PORT || 3000; // Use environment variable or default port

app.use(express.json()); // middleware inbuilt in express to recognize the incoming Request Object as a JSON Object.
app.use(express.urlencoded()); // middleware inbuilt in express to recognize the incoming Request Object as strings or arrays

app.listen(port, async () => {
  try {
    // Connect to the database
    await sql.connect(dbConfig);
    console.log("Database connection established successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    // Terminate the application with an error code (optional)
    process.exit(1); // Exit with code 1 indicating an error
  }

  console.log(`Server listening on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");

  await sql.close();
  console.log("Database connection closed");
  process.exit(0); // Exit with code 0 indicating successful shutdown
});


//PUT Route for updating the hygiene record

app.get("/stalls/:id/hygiene", async (req, res) => {
  const stallId = parseInt(req.params.id);
  const { InspectionDate, Grade } = req.body;
  if (isNaN(stallId)) {
    return res.status(400).send("Invalid stall ID");
  }
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const sqlQuery = `
      UPDATE HygieneRecord
      SET
        InspectionDate = @InspectionDate,
        Grade = @Grade
      WHERE StallID = @id
    `;
    const request = connection.request();
    request.input("id", stallId);
    request.input("InspectionDate", InspectionDate);
    request.input("Grade", Grade);
    const result = await request.query(sqlQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Hygiene record not found");
    }

    res.status(200).json({
      message: "Hygiene record updated successfully"
    });

  } catch (error) {
    console.error(`Error in PUT /stalls/${stallId}/hygiene:`, error);
    res.status(500).send("Error updating hygiene record");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
});


//POST for creating new records for stalls that have not been scored

app.post("/stalls/:id/hygiene", async (req, res) => {
  const stallId = parseInt(req.params.id);
  const { InspectionDate, Grade } = req.body;

  if (isNaN(stallId)) {
    return res.status(400).send("Invalid stall ID");
  }

  if (!InspectionDate || !Grade) {
    return res.status(400).send("InspectionDate and Grade are required");
  }

  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const sqlQuery = `
      INSERT INTO HygieneRecord (StallID, InspectionDate, Grade)
      VALUES (@stallId, @inspectionDate, @grade)
    `;

    const request = connection.request();
    request.input("stallId", stallId);
    request.input("inspectionDate", InspectionDate);
    request.input("grade", Grade);

    await request.query(sqlQuery);

    res.status(201).send("Hygiene record created successfully");
  } catch (error) {
    console.error(`Error in POST /stalls/${stallId}/hygiene:`, error);
    res.status(500).send("Error creating hygiene record");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
});