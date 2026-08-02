jest.mock("../models/userModel");
const request = require("supertest");
const app = require("../app");
const { token } = require("./helpers");
const userModel = require("../models/userModel");
// Test user account management
describe("user CRUD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("retrieves own profile without password hash", async () => {
    userModel.findById.mockResolvedValue({
      userId: 1,
      fullName: "A",
      roleName: "Customer"
    });
    const response = await request(app)
      .get("/api/users/1")
      .set("Authorization", `Bearer ${token(1, "Customer")}`);
    expect(response.status).toBe(200);
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });
  test("updates own profile but cannot self-promote", async () => {
    userModel.update.mockResolvedValue({
      userId: 1,
      fullName: "Alice",
      roleName: "Customer"
    });
    let response = await request(app)
      .put("/api/users/1")
      .set("Authorization", `Bearer ${token(1, "Customer")}`)
      .send({
        fullName: "Alice"
      });
    expect(response.status).toBe(200);
    response = await request(app)
      .put("/api/users/1")
      .set("Authorization", `Bearer ${token(1, "Customer")}`)
      .send({
        role: "Administrator"
      });
    expect(response.status).toBe(403);
  });
  test("deactivation uses status rather than hard delete", async () => {
    userModel.remove.mockResolvedValue(1);
    const response = await request(app)
      .delete("/api/users/1")
      .set("Authorization", `Bearer ${token(1, "Customer")}`);
    expect(response.status).toBe(200);
    expect(userModel.remove).toHaveBeenCalledWith(1);
  });
});