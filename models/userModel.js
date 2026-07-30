const { sql, getPool } = require("../config/database");
const AppError = require("../utils/AppError");

const PUBLIC_COLUMNS = `
  ua.UserID AS userId,
  ua.FullName AS fullName,
  ua.Email AS email,
  ua.Phone AS phone,
  ur.RoleCode AS role,
  ur.RoleName AS roleName,
  ua.IsActive AS isActive,
  ua.CreatedAt AS createdAt,
  ua.UpdatedAt AS updatedAt,
  c.CustomerID AS customerId,
  so.OwnerID AS ownerId,
  op.OperatorID AS operatorId,
  nof.OfficerID AS officerId
`;

const PROFILE_JOINS = `
  INNER JOIN dbo.UserRole ur ON ur.RoleID = ua.RoleID
  LEFT JOIN dbo.Customer c ON c.UserID = ua.UserID
  LEFT JOIN dbo.StallOwner so ON so.UserID = ua.UserID
  LEFT JOIN dbo.Operator op ON op.UserID = ua.UserID
  LEFT JOIN dbo.NEA_Officer nof ON nof.UserID = ua.UserID
`;

function addInputs(request, values) {
  for (const [name, definition] of Object.entries(values)) {
    request.input(name, definition.type, definition.value);
  }
  return request;
}

async function findByEmail(email, includePassword = false) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", sql.NVarChar(254), email.trim().toLowerCase())
    .query(`
      SELECT ${PUBLIC_COLUMNS}
        ${includePassword ? ", ua.PasswordHash AS passwordHash" : ""}
      FROM dbo.UserAccount ua
      ${PROFILE_JOINS}
      WHERE ua.NormalizedEmail = @email
    `);
  return result.recordset[0] || null;
}

async function findById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT ${PUBLIC_COLUMNS}
      FROM dbo.UserAccount ua
      ${PROFILE_JOINS}
      WHERE ua.UserID = @userId
    `);
  return result.recordset[0] || null;
}

async function findActiveIdentityById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT
        ua.UserID AS userId,
        ua.FullName AS fullName,
        ua.Email AS email,
        ur.RoleCode AS role,
        c.CustomerID AS customerId,
        so.OwnerID AS ownerId,
        op.OperatorID AS operatorId,
        nof.OfficerID AS officerId
      FROM dbo.UserAccount ua
      ${PROFILE_JOINS}
      WHERE ua.UserID = @userId AND ua.IsActive = 1
    `);
  return result.recordset[0] || null;
}

async function listUsers(filters) {
  const pool = await getPool();
  const request = pool.request();
  const where = [];

  if (filters.search) {
    request.input("search", sql.NVarChar(102), `%${filters.search}%`);
    where.push("(ua.FullName LIKE @search OR ua.Email LIKE @search)");
  }
  if (filters.role) {
    request.input("role", sql.VarChar(30), filters.role);
    where.push("ur.RoleCode = @role");
  }
  if (filters.status) {
    request.input("isActive", sql.Bit, filters.status === "active");
    where.push("ua.IsActive = @isActive");
  }

  const offset = (filters.page - 1) * filters.limit;
  request.input("offset", sql.Int, offset);
  request.input("limit", sql.Int, filters.limit);

  const result = await request.query(`
    SELECT ${PUBLIC_COLUMNS}, COUNT(*) OVER() AS totalCount
    FROM dbo.UserAccount ua
    ${PROFILE_JOINS}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ua.UserID
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const total = result.recordset[0]?.totalCount || 0;
  return {
    users: result.recordset.map(({ totalCount, ...user }) => user),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

function profileMapping(role) {
  return {
    customer: { table: "Customer", idColumn: "CustomerID" },
    vendor: { table: "StallOwner", idColumn: "OwnerID" },
    operator: { table: "Operator", idColumn: "OperatorID" },
    nea_officer: { table: "NEA_Officer", idColumn: "OfficerID" }
  }[role];
}

async function createUser(data) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const roleResult = await new sql.Request(transaction)
      .input("role", sql.VarChar(30), data.role)
      .query("SELECT RoleID FROM dbo.UserRole WHERE RoleCode = @role");
    const roleId = roleResult.recordset[0]?.RoleID;
    if (!roleId) throw new AppError(400, "Invalid account role");

    const insertResult = await new sql.Request(transaction)
      .input("fullName", sql.NVarChar(100), data.fullName)
      .input("email", sql.NVarChar(254), data.email)
      .input("passwordHash", sql.VarChar(255), data.passwordHash)
      .input("phone", sql.VarChar(20), data.phone || null)
      .input("roleId", sql.TinyInt, roleId)
      .query(`
        INSERT INTO dbo.UserAccount
          (FullName, Email, PasswordHash, Phone, RoleID)
        OUTPUT INSERTED.UserID
        VALUES
          (@fullName, @email, @passwordHash, @phone, @roleId)
      `);

    const userId = insertResult.recordset[0].UserID;
    const mapping = profileMapping(data.role);

    if (data.profileId) {
      if (!mapping) {
        throw new AppError(
          400,
          "This role does not use a separate profile record"
        );
      }

      const profileResult = await new sql.Request(transaction)
        .input("profileId", sql.VarChar(10), data.profileId)
        .query(`
          SELECT UserID
          FROM dbo.${mapping.table}
          WHERE ${mapping.idColumn} = @profileId
        `);
      const profile = profileResult.recordset[0];
      if (!profile) throw new AppError(400, "The selected profile does not exist");
      if (profile.UserID) {
        throw new AppError(409, "The selected profile is already linked");
      }

      await new sql.Request(transaction)
        .input("profileId", sql.VarChar(10), data.profileId)
        .input("userId", sql.Int, userId)
        .query(`
          UPDATE dbo.${mapping.table}
          SET UserID = @userId
          WHERE ${mapping.idColumn} = @profileId
        `);
    }

    await transaction.commit();
    return findById(userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateUser(userId, changes) {
  const pool = await getPool();
  const request = pool.request().input("userId", sql.Int, userId);
  const sets = [];

  const fields = {
    fullName: { column: "FullName", type: sql.NVarChar(100) },
    email: { column: "Email", type: sql.NVarChar(254) },
    phone: { column: "Phone", type: sql.VarChar(20) },
    passwordHash: { column: "PasswordHash", type: sql.VarChar(255) },
    isActive: { column: "IsActive", type: sql.Bit }
  };

  for (const [key, definition] of Object.entries(fields)) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      request.input(key, definition.type, changes[key]);
      sets.push(`${definition.column} = @${key}`);
    }
  }

  if (changes.role) {
    request.input("role", sql.VarChar(30), changes.role);
    sets.push(
      "RoleID = (SELECT RoleID FROM dbo.UserRole WHERE RoleCode = @role)"
    );
  }

  if (!sets.length) return findById(userId);
  sets.push("UpdatedAt = SYSUTCDATETIME()");

  const result = await request.query(`
    UPDATE dbo.UserAccount
    SET ${sets.join(", ")}
    WHERE UserID = @userId
  `);
  if (!result.rowsAffected[0]) return null;
  return findById(userId);
}

async function getPasswordHash(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(
      "SELECT PasswordHash AS passwordHash FROM dbo.UserAccount WHERE UserID = @userId"
    );
  return result.recordset[0]?.passwordHash || null;
}

async function emailExists(email, excludeUserId = null) {
  const pool = await getPool();
  const request = pool
    .request()
    .input("email", sql.NVarChar(254), email.trim().toLowerCase());
  let query =
    "SELECT 1 AS found FROM dbo.UserAccount WHERE NormalizedEmail = @email";
  if (excludeUserId !== null) {
    request.input("excludeUserId", sql.Int, excludeUserId);
    query += " AND UserID <> @excludeUserId";
  }
  const result = await request.query(query);
  return result.recordset.length > 0;
}

module.exports = {
  findByEmail,
  findById,
  findActiveIdentityById,
  listUsers,
  createUser,
  updateUser,
  getPasswordHash,
  emailExists
};
