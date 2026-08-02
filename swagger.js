const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Validate the same OpenAPI file served by app.js.
const documentationPath = path.join(
  __dirname,
  "docs",
  "openapi-user-account.yaml"
);
const document = yaml.load(
  fs.readFileSync(documentationPath, "utf8")
);

if (document.openapi !== "3.0.3" || !document.paths) {
  throw new Error("The OpenAPI document is incomplete.");
}

console.log(
  `OpenAPI validation passed for ${Object.keys(document.paths).length} documented paths.`
);
