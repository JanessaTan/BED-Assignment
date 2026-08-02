const fs = require("fs");
const path = require("path");

const frontend = path.join(__dirname, "..", "HawkerCentre-Frontend");
const connectedPages = [
  "login",
  "register",
  "profile",
  "home",
  "crowd-level",
  "admin-users",
  "browse-hawker-centres",
  "stalls",
  "menu-item",
  "stall-management",
  "menu-management",
  "cuisine-management",
  "promotion",
  "vendor-dashboard"
];

describe("frontend and backend integration", () => {
  test.each(connectedPages)("%s loads the shared API client", (page) => {
    const html = fs.readFileSync(
      path.join(frontend, "html", `${page}.html`),
      "utf8"
    );
    expect(html).toContain("../js/api.js");
  });

  test.each([
    "browse-hawker-centres",
    "home",
    "crowd-level",
    "stalls",
    "menu-item",
    "stall-management",
    "menu-management",
    "cuisine-management",
    "promotion",
    "vendor-dashboard"
  ])("%s does not use seeded business records", (page) => {
    const source = fs.readFileSync(
      path.join(frontend, "js", `${page}.js`),
      "utf8"
    );
    expect(source).toMatch(/api(Get|Post|Put|Patch|Delete)\(/);
    expect(source).not.toMatch(/HC\.(loadData|saveData|centres|stalls|getMenuItems)/);
  });

  test("login sends the selected role to the backend", () => {
    const source = fs.readFileSync(
      path.join(frontend, "js", "login.js"),
      "utf8"
    );
    expect(source).toContain('apiPost("/auth/login"');
    expect(source).toContain("role\n");
  });
});
