process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-secret-with-at-least-thirty-two-characters";
const { createToken } = require("../utils/tokenUtils");
// Create a token for testing
function token(userId, roleName) {
  return createToken({
    userId,
    roleName
  });
}
module.exports = {
  token
};