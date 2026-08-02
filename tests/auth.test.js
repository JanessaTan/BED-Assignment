jest.mock("../models/userModel");
jest.mock("../utils/passwordUtils", () => ({
  hashPassword: jest.fn(async () => "$2b$12$hash"),
  comparePassword: jest.fn()
}));
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-secret-with-at-least-thirty-two-characters";
const request = require("supertest");
const app = require("../app");
const userModel = require("../models/userModel");
const passwordUtils = require("../utils/passwordUtils");
const user = {
  userId: 1,
  fullName: "Test Customer",
  email: "test@example.sg",
  roleName: "Customer",
  accountStatus: "Active"
};
// Test registration and login
describe("authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("registers a valid public customer", async () => {
    userModel.findByIdentifier.mockResolvedValue(null);
    userModel.create.mockResolvedValue(user);
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test Customer",
        email: "test@example.sg",
        password: "Test1234",
        confirmPassword: "Test1234",
        role: "Customer",
        termsAccepted: true
      });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(response.body.data.token).toBeTruthy();
  });
  test("rejects duplicate email", async () => {
    userModel.findByIdentifier.mockResolvedValue({
      ...user,
      passwordHash: "hidden"
    });
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test Customer",
        email: "test@example.sg",
        password: "Test1234",
        confirmPassword: "Test1234",
        role: "Customer",
        termsAccepted: true
      });
    expect(response.status).toBe(409);
    expect(response.body.errors[0].field).toBe("email");
  });
  test("allows public Operator registration", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test Operator",
        email: "operator@example.sg",
        password: "Test1234",
        confirmPassword: "Test1234",
        role: "Operator",
        termsAccepted: true
      });
    expect(response.status).toBe(201);
  });
  test("logs in with valid credentials", async () => {
    userModel.findByIdentifier.mockResolvedValue({
      ...user,
      passwordHash: "hash"
    });
    passwordUtils.comparePassword.mockResolvedValue(true);
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: "test@example.sg",
        password: "Test1234",
        role: "Customer"
      });
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeTruthy();
  });
  test("returns 401 for an invalid password", async () => {
    userModel.findByIdentifier.mockResolvedValue({
      ...user,
      passwordHash: "hash"
    });
    passwordUtils.comparePassword.mockResolvedValue(false);
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: "test@example.sg",
        password: "Wrong123",
        role: "Customer"
      });
    expect(response.status).toBe(401);
  });
});