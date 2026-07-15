const sql = require("mssql");
const dbConfig = require("../dbConfig");

// GET current hygiene record

async function getCurrentHygiene(stallId){
    const connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("StallID", stallId);

    const result = await request.query(`
        SELECT TOP 1
            InspectionDate,
            GradeExpiry,
            HygieneGrade
        FROM Inspection
        WHERE StallID = @StallID
        ORDER BY InspectionDate DESC
    `);
    return result.recordset[0];
}

// PUT route for hygiene

async function updateHygiene(inspectionId, data){
    const connection = await sql.connect(dbConfig);
    const request = connection.request();

    request.input("InspectionID", inspectionId);
    request.input("InspectionDate", data.InspectionDate);
    request.input("HygieneGrade", data.HygieneGrade);
    request.input("GradeExpiry", data.GradeExpiry);
    request.input("OfficerID", data.OfficerID);

    const result = await request.query(`
        UPDATE Inspection
        SET
            InspectionDate = @InspectionDate,
            HygieneGrade = @HygieneGrade,
            GradeExpiry = @GradeExpiry,
            OfficerID = @OfficerID
        WHERE InspectionID = @InspectionID
    `);
    return result.rowsAffected[0];
}

// POST route for hygiene

async function createHygiene(data){
    const connection = await sql.connect(dbConfig);
    const request = connection.request();

    request.input("InspectionID", data.InspectionID);
    request.input("InspectionDate", data.InspectionDate);
    request.input("HygieneGrade", data.HygieneGrade);
    request.input("GradeExpiry", data.GradeExpiry);
    request.input("OfficerID", data.OfficerID);
    request.input("StallID", data.StallID);

    await request.query(`
        INSERT INTO Inspection
        (
            InspectionID,
            InspectionDate,
            HygieneGrade,
            GradeExpiry,
            OfficerID,
            StallID
        )

        VALUES
        (
            @InspectionID,
            @InspectionDate,
            @HygieneGrade,
            @GradeExpiry,
            @OfficerID,
            @StallID
        )
    `);
}


module.exports = {
    getCurrentHygiene,
    updateHygiene,
    createHygiene
};