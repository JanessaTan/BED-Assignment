const bcrypt = require("bcryptjs");

// Convert a plain password into a secure password hash
function hashPassword(password) {
  return bcrypt.hash(
    password,
    Number(process.env.BCRYPT_ROUNDS || 12)
  );
}

// Compare a plain password with a stored password hash
function comparePassword(password, passwordHash) {
  return bcrypt.compare(
    password,
    passwordHash
  );
}

module.exports = {
  hashPassword,
  comparePassword
};
