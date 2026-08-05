const { sql, poolPromise } = require('../dbConfig');

// GET current hygiene record

async function getCurrentHygiene(stallId){
    const connection = await poolPromise;
    const request = connection.request();

    request.input("StallID", stallId);

    const result = await request.query(`
        SELECT TOP 1
        i.InspectionID,
        i.StallID,
        i.InspectionDate,
        i.GradeExpiry,
        i.HygieneGrade,
        i.OfficerID,
        r.InspectionRemark
        FROM Inspection i
        LEFT JOIN InspectionRemark r
        ON i.InspectionID = r.InspectionID
        WHERE i.StallID = @StallID
        ORDER BY i.InspectionDate DESC;
    `);

    return result.recordset[0];
}
// PUT route for hygiene 

async function updateHygiene(inspectionId, data){
    const connection = await poolPromise;
    const request = connection.request();

    request.input("InspectionID", inspectionId);
    request.input("InspectionDate", data.InspectionDate);
    request.input("HygieneGrade", data.HygieneGrade);
    request.input("GradeExpiry", data.GradeExpiry);
    request.input("OfficerID", data.OfficerID);
    request.input("InspectionRemark", data.InspectionRemark);

    const result = await request.query(`
        UPDATE Inspection
        SET
            InspectionDate = @InspectionDate,
            HygieneGrade = @HygieneGrade,
            GradeExpiry = @GradeExpiry,
            OfficerID = @OfficerID
        WHERE InspectionID = @InspectionID
    `);

    const remarkRequest = connection.request();

    remarkRequest.input("InspectionID", inspectionId);
    remarkRequest.input("InspectionRemark", data.InspectionRemark);

    await remarkRequest.query(`
    UPDATE InspectionRemark
    SET InspectionRemark = @InspectionRemark
    WHERE InspectionID = @InspectionID
    `);
    return result.rowsAffected[0];
}

async function getOfficerID(userId) {
    const connection = await poolPromise;

    const result = await connection.request()
        .input("userId", sql.Int, userId)
        .query(`
            SELECT OfficerID
            FROM NEA_Officer
            WHERE LinkedUserID = @userId
        `);

    if (result.recordset.length === 0) {
        throw new Error("NEA Officer record not found");
    }

    return result.recordset[0].OfficerID;
}

async function createHygiene(data) {
    console.log("createHygiene data:", data);
    const connection = await poolPromise;

    // Generate new InspectionID
    const idRequest = connection.request();

    const lastInspection = await idRequest.query(`
        SELECT TOP 1 InspectionID
        FROM Inspection
        ORDER BY InspectionID DESC
    `);

    let newInspectionID = "DINSP00001";
    console.log(lastInspection.recordset);
    console.log(lastInspection.recordset[0]);
    console.log("InspectionID:", lastInspection.recordset[0]?.InspectionID);
    if (lastInspection.recordset.length > 0) {
        console.log("LAST RECORD:", lastInspection.recordset[0]);
        const lastID = lastInspection.recordset[0].InspectionID;
        console.log("LAST ID:", lastID);

        // Remove the "DINSP" prefix
        const number = parseInt(lastID.replace("DINSP", ""), 10);
        console.log("NUMBER:", number);

        newInspectionID = "DINSP" + String(number + 1).padStart(5, "0");
    }

    // Create inspection record
    let request = connection.request();

    request.input("InspectionID", newInspectionID);
    request.input("InspectionDate", data.InspectionDate);
    request.input("HygieneGrade", data.HygieneGrade);
    request.input("GradeExpiry", data.GradeExpiry);
    request.input("OfficerID", data.OfficerID);
    request.input("StallID", data.StallID);

    console.log({
    InspectionID: newInspectionID,
    InspectionDate: data.InspectionDate,
    HygieneGrade: data.HygieneGrade,
    GradeExpiry: data.GradeExpiry,
    OfficerID: data.OfficerID,
    StallID: data.StallID
});
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

    // Create remark record
    request = connection.request();

    request.input("InspectionID", newInspectionID);
    request.input("InspectionRemark", data.InspectionRemark);

    await request.query(`
        INSERT INTO InspectionRemark
        (
            InspectionID,
            InspectionRemark
        )
        VALUES
        (
            @InspectionID,
            @InspectionRemark
        )
    `);

    return newInspectionID;
}


module.exports = {
    getCurrentHygiene,
    updateHygiene,
    createHygiene,
    getOfficerID
};