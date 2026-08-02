const { sql, request } = require("./modelHelper");
// Retrieve stalls managed by the operator
async function list(userId, isAdmin) {
  const req = await request();
  req.input("userId", sql.Int, userId);
  req.input("isAdmin", sql.Bit, isAdmin);
  const result = await req.query(`
    SELECT DISTINCT
      s.stall_id AS stallId,
      s.name,
      s.unit_number AS unitNumber,
      s.opening_hours AS openingHours,
      so.operational_status AS operationalStatus,
      so.maintenance_note AS maintenanceNote,
      so.updated_at AS updatedAt
    FROM stalls s
    LEFT JOIN operator_centres oc
      ON oc.centre_id = s.centre_id
    LEFT JOIN stall_operations so
      ON so.stall_id = s.stall_id
    WHERE oc.user_id = @userId
      OR @isAdmin = 1
    ORDER BY s.name;
  `);
  return result.recordset;
}
// Update a stall's operating status
async function update(stallId, userId, isAdmin, data) {
  const req = await request();
  req.input("stallId", sql.Int, stallId);
  req.input("userId", sql.Int, userId);
  req.input("isAdmin", sql.Bit, isAdmin);
  req.input(
    "status",
    sql.VarChar(30),
    data.operationalStatus
  );
  req.input(
    "note",
    sql.NVarChar(250),
    data.maintenanceNote || null
  );
  const result = await req.query(`
    IF NOT EXISTS (
      SELECT 1
      FROM stalls s
      LEFT JOIN operator_centres oc
        ON oc.centre_id = s.centre_id
        AND oc.user_id = @userId
      WHERE s.stall_id = @stallId
        AND (
          @isAdmin = 1
          OR oc.user_id IS NOT NULL
        )
    )
      THROW 50003, 'Stall is outside your managed centre', 1;
    MERGE stall_operations AS target
    USING (
      SELECT @stallId AS stall_id
    ) AS source
      ON target.stall_id = source.stall_id
    WHEN MATCHED THEN
      UPDATE SET
        operational_status = @status,
        maintenance_note = @note,
        updated_by = @userId,
        updated_at = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
      INSERT (
        stall_id,
        operational_status,
        maintenance_note,
        updated_by
      )
      VALUES (
        @stallId,
        @status,
        @note,
        @userId
      );
    SELECT
      @stallId AS stallId,
      @status AS operationalStatus,
      @note AS maintenanceNote;
  `);
  return result.recordset[0];
}
// Retrieve the operator dashboard summary
async function summary(userId, isAdmin) {
  const req = await request();
  req.input("userId", sql.Int, userId);
  req.input("isAdmin", sql.Bit, isAdmin);
  const result = await req.query(`
    SELECT
      COUNT(DISTINCT s.stall_id) AS managedStalls,
      COUNT(
        DISTINCT CASE
          WHEN ra.status = 'Active'
          THEN ra.agreement_id
        END
      ) AS activeAgreements,
      COUNT(
        DISTINCT CASE
          WHEN c.status NOT IN ('Resolved', 'Rejected')
          THEN c.complaint_id
        END
      ) AS openComplaints,
      COUNT(
        DISTINCT CASE
          WHEN so.operational_status = 'Open'
          THEN so.stall_id
        END
      ) AS openStalls
    FROM stalls s
    LEFT JOIN operator_centres oc
      ON oc.centre_id = s.centre_id
    LEFT JOIN rental_agreements ra
      ON ra.stall_id = s.stall_id
    LEFT JOIN complaints c
      ON c.stall_id = s.stall_id
    LEFT JOIN stall_operations so
      ON so.stall_id = s.stall_id
    WHERE oc.user_id = @userId
      OR @isAdmin = 1;
  `);
  const stats = result.recordset[0];
  const operations = await list(userId, isAdmin);
  return {
    stats,
    operations
  };
}
module.exports = {
  list,
  update,
  summary
};