const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const ignored = new Set([
  "node_modules",
  ".git",
  "coverage"
]);
const javaScriptFiles = [];
// Find all JavaScript files
function walk(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true
  });
  for (const entry of entries) {
    if (ignored.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(
      directory,
      entry.name
    );
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith(".js")) {
      javaScriptFiles.push(fullPath);
    }
  }
}
// Check every JavaScript file
walk(root);
for (const file of javaScriptFiles) {
  const source = fs.readFileSync(
    file,
    "utf8"
  );
  try {
    new Function(source);
  } catch (error) {
    const relativePath = path.relative(
      root,
      file
    );
    console.error(
      `Syntax error in ${relativePath}: ${error.message}`
    );
    process.exitCode = 1;
  }
}
// Check whether route files are mounted
const appSource = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);
const routesPath = path.join(
  root,
  "routes"
);
const excludedRoutes = [
  "likeRoutes.js",
  "stallHygieneRoutes.js"
];
for (const routeFile of fs.readdirSync(routesPath)) {
  const routeName = routeFile.replace(
    ".js",
    ""
  );
  const isMounted =
    appSource.includes(routeName);
  const isExcluded =
    excludedRoutes.includes(routeFile);
  if (!isMounted && !isExcluded) {
    console.warn(
      `Review route mount: ${routeFile}`
    );
  }
}
// Show the final result
if (!process.exitCode) {
  console.log(
    `Static project check passed for ${javaScriptFiles.length} JavaScript files.`
  );
}