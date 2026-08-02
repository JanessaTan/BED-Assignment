const ROLES = Object.freeze({
  CUSTOMER: "Customer",
  VENDOR: "Vendor",
  OPERATOR: "Operator",
  NEA_OFFICER: "NEA Officer",
  ADMINISTRATOR: "Administrator"
});

const PUBLIC_REGISTRATION_ROLES = Object.freeze([
  ROLES.CUSTOMER,
  ROLES.VENDOR,
  ROLES.NEA_OFFICER,
  ROLES.OPERATOR
]);

module.exports = {
  ROLES,
  PUBLIC_REGISTRATION_ROLES
};