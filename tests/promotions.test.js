jest.mock("../models/promotionModel");
jest.mock("../models/stallModel");
const request = require("supertest");
const app = require("../app");
const { token } = require("./helpers");
const promotionModel = require("../models/promotionModel");
const stallModel = require("../models/stallModel");
const body = {
  stallId: 1,
  name: "Offer",
  description: "A useful promotion",
  discountType: "Fixed",
  discountValue: 1,
  startDate: "2026-01-01",
  endDate: "2027-01-01",
  menuItemIds: [1]
};
// Test promotion management
describe("promotion CRUD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stallModel.vendorOwns.mockResolvedValue(true);
  });
  test("vendor creates promotion", async () => {
    promotionModel.create.mockResolvedValue({
      promotionId: 1,
      ...body
    });
    const response = await request(app)
      .post("/api/promotions")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`)
      .send(body);
    expect(response.status).toBe(201);
  });
  test("reversed dates are rejected", async () => {
    const response = await request(app)
      .post("/api/promotions")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`)
      .send({
        ...body,
        startDate: "2027-01-01",
        endDate: "2026-01-01"
      });
    expect(response.status).toBe(400);
  });
  test("delete checks ownership", async () => {
    promotionModel.findById.mockResolvedValue({
      promotionId: 1,
      stallId: 1
    });
    promotionModel.remove.mockResolvedValue(1);
    const response = await request(app)
      .delete("/api/promotions/1")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`);
    expect(response.status).toBe(200);
  });
});