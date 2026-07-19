const { sql, poolPromise } = require('../dbConfig');

// GET current hygiene record

async function getCurrentHygiene(stallId){
    const connection = await poolPromise;
    const request = connection.request();

    request.input("StallID", stallId);

    const result = await request.query(`
        SELECT TOP 1
            i.InspectionID,
            i.InspectionDate,
            i.GradeExpiry,
            i.HygieneGrade,
            r.InspectionRemark
        FROM Inspection i
        LEFT JOIN InspectionRemark r
            ON i.InspectionID = r.InspectionID
        WHERE i.StallID = @StallID
        ORDER BY i.InspectionDate DESC
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

// POST route for hygiene

async function createHygiene(data){
    const connection = await poolPromise;

    // Create inspection
    let request = connection.request();

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


    // Create remark
    request = connection.request();

    request.input("InspectionID", data.InspectionID);
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
}


module.exports = {
    getCurrentHygiene,
    updateHygiene,
    createHygiene
};