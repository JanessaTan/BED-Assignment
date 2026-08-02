jest.mock("../models/userModel");
const request = require("supertest");
const app = require("../app");
const { token } = require("./helpers");
const userModel = require("../models/userModel");
// Test authentication and role permissions
describe("authentication and role middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("missing token returns 401", async () => {
    const response = await request(app).get("/api/users/me");
    expect(response.status).toBe(401);
  });
  test("invalid token returns 401", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid");
    expect(response.status).toBe(401);
  });
  test("Customer cannot list all users", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token(1, "Customer")}`);
    expect(response.status).toBe(403);
  });
  test("Administrator can list users", async () => {
    userModel.list.mockResolvedValue({
      rows: [],
      page: 1,
      limit: 20,
      total: 0
    });
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token(5, "Administrator")}`);
    expect(response.status).toBe(200);
  });
  test("Customer cannot read another user profile", async () => {
    const response = await request(app)
      .get("/api/users/2")
      .set("Authorization", `Bearer ${token(1, "Customer")}`);
    expect(response.status).toBe(403);
  });
});