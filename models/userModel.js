const {
  sql,
  getPool,
  request,
  pageValues
} = require("./modelHelpers");
// Select safe user information without the password
const safeUserColumns = `
  u.user_id AS userId,
  u.full_name AS fullName,
  u.email,
  u.phone,
  r.role_name AS roleName,
  u.account_status AS accountStatus,
  u.created_at AS createdAt,
  u.updated_at AS updatedAt,
  (
    SELECT TOP (1) so.stall_id
    FROM stall_owners so
    WHERE so.vendor_id = u.user_id
      AND (
        so.end_date IS NULL
        OR so.end_date >= CAST(GETDATE() AS DATE)
      )
    ORDER BY so.start_date DESC
  ) AS stallId,
  (
    SELECT TOP (1) oc.centre_id
    FROM operator_centres oc
    WHERE oc.user_id = u.user_id
    ORDER BY oc.assigned_at DESC
  ) AS centreId
`;
// Find a user by email or full name
async function findByIdentifier(identifier) {
  const req = await request();
  req.input(
    "identifier",
    sql.NVarChar(254),
    identifier.trim().toLowerCase()
  );
  const result = await req.query(`
    SELECT TOP (1)
      ${safeUserColumns},
      u.password_hash AS passwordHash
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.email_normalized = @identifier
      OR LOWER(u.full_name) = @identifier
    ORDER BY
      CASE
        WHEN u.email_normalized = @identifier THEN 0
        ELSE 1
      END,
      u.user_id;
  `);
  return result.recordset[0] || null;
}
// Find a user by ID
async function findById(userId) {
  const req = await request();
  req.input("userId", sql.Int, userId);
  const result = await req.query(`
    SELECT ${safeUserColumns}
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.user_id = @userId;
  `);
  return result.recordset[0] || null;
}
// Create a new user
async function create(data) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = new sql.Request(transaction);
    req.input("role", sql.NVarChar(40), data.role);
    req.input("fullName", sql.NVarChar(120), data.fullName);
    req.input("email", sql.NVarChar(254), data.email);
    req.input(
      "emailNormalized",
      sql.NVarChar(254),
      data.email.trim().toLowerCase()
    );
    req.input(
      "passwordHash",
      sql.NVarChar(100),
      data.passwordHash
    );
    req.input(
      "phone",
      sql.VarChar(8),
      data.phone || null
    );
    const result = await req.query(`
      DECLARE @roleId INT = (
        SELECT role_id
        FROM roles
        WHERE role_name = @role
      );
      IF @roleId IS NULL
        THROW 50001, 'Invalid role', 1;
      INSERT INTO users (
        role_id,
        full_name,
        email,
        email_normalized,
        password_hash,
        phone
      )
      OUTPUT INSERTED.user_id
      VALUES (
        @roleId,
        @fullName,
        @email,
        @emailNormalized,
        @passwordHash,
        @phone
      );
    `);
    const userId = result.recordset[0].user_id;
    await transaction.commit();
    return findById(userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
// Retrieve users with filters and pagination
async function list(filters) {
  const {
    page,
    limit,
    offset
  } = pageValues(filters);
  const req = await request();
  req.input(
    "search",
    sql.NVarChar(120),
    filters.search ? `%${filters.search}%` : null
  );
  req.input(
    "role",
    sql.NVarChar(40),
    filters.role || null
  );
  req.input("offset", sql.Int, offset);
  req.input("limit", sql.Int, limit);
  const result = await req.query(`
    SELECT
      ${safeUserColumns},
      COUNT(*) OVER() AS totalCount
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE (
      @search IS NULL
      OR u.full_name LIKE @search
      OR u.email LIKE @search
    )
      AND (
        @role IS NULL
        OR r.role_name = @role
      )
    ORDER BY u.user_id
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);
  const total = result.recordset[0]?.totalCount || 0;
  const rows = result.recordset.map(
    ({ totalCount, ...row }) => row
  );
  return {
    rows,
    page,
    limit,
    total
  };
}
// Update a user account
async function update(userId, data, allowRoleChange) {
  const assignments = [];
  const req = await request();
  req.input("userId", sql.Int, userId);
  if (data.fullName !== undefined) {
    assignments.push("full_name = @fullName");
    req.input(
      "fullName",
      sql.NVarChar(120),
      data.fullName
    );
  }
  if (data.email !== undefined) {
    assignments.push(
      "email = @email",
      "email_normalized = @emailNormalized"
    );
    req.input(
      "email",
      sql.NVarChar(254),
      data.email
    );
    req.input(
      "emailNormalized",
      sql.NVarChar(254),
      data.email.toLowerCase()
    );
  }
  if (data.phone !== undefined) {
    assignments.push("phone = @phone");
    req.input(
      "phone",
      sql.VarChar(8),
      data.phone || null
    );
  }
  if (allowRoleChange && data.role !== undefined) {
    assignments.push(
      "role_id = (SELECT role_id FROM roles WHERE role_name = @role)"
    );
    req.input(
      "role",
      sql.NVarChar(40),
      data.role
    );
  }
  if (!assignments.length) {
    return findById(userId);
  }
  assignments.push("updated_at = SYSUTCDATETIME()");
  await req.query(`
    UPDATE users
    SET ${assignments.join(", ")}
    WHERE user_id = @userId;
  `);
  return findById(userId);
}
// Update a user's account status
async function updateStatus(userId, status) {
  const req = await request();
  req.input("userId", sql.Int, userId);
  req.input("status", sql.VarChar(20), status);
  const result = await req.query(`
    UPDATE users
    SET
      account_status = @status,
      updated_at = SYSUTCDATETIME()
    WHERE user_id = @userId;
    SELECT @@ROWCOUNT AS affected;
  `);
  return result.recordset[0].affected;
}
// Deactivate a user account
async function remove(userId) {
  return updateStatus(userId, "Deactivated");
}
module.exports = {
  findByIdentifier,
  findById,
  create,
  list,
  update,
  updateStatus,
  remove
};