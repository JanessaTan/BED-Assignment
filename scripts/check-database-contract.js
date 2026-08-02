const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const sqlPath = path.join(__dirname, "..", "HCMS.sql");
const source = fs.readFileSync(sqlPath, "utf8");
const requiredTables = [
  "roles",
  "users",
  "hawker_centres",
  "operator_centres",
  "stalls",
  "stall_owners",
  "cuisines",
  "stall_cuisines",
  "menu_items",
  "menu_item_cuisines",
  "menu_add_ons",
  "promotions",
  "promotion_menu_items"
];

const missingTables = requiredTables.filter((table) =>
  !new RegExp(`CREATE TABLE\\s+${table}\\s*\\(`, "i").test(source)
);
if (missingTables.length) {
  throw new Error(`HCMS.sql is missing tables: ${missingTables.join(", ")}`);
}

const constraintNames = [...source.matchAll(/CONSTRAINT\s+([A-Za-z0-9_]+)/gi)]
  .map((match) => match[1].toLowerCase());
const duplicateConstraints = constraintNames.filter(
  (name, index) => constraintNames.indexOf(name) !== index
);
if (duplicateConstraints.length) {
  throw new Error(
    `HCMS.sql contains duplicate constraint names: ${[...new Set(duplicateConstraints)].join(", ")}`
  );
}

const hash = source.match(/DECLARE @passwordHash NVARCHAR\(100\)='([^']+)'/)?.[1];
if (!hash || !bcrypt.compareSync("Demo1234!", hash)) {
  throw new Error("The sample bcrypt hash does not match Demo1234!.");
}

console.log(
  `Database contract check passed for ${requiredTables.length} core tables and the demo password hash.`
);
