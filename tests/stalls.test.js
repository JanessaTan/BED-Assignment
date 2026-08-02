jest.mock("../models/stallModel");
const request = require("supertest");
const app = require("../app");
const { token } = require("./helpers");
const stallModel = require("../models/stallModel");
const body = {
  centreId: 1,
  name: "Test Stall",
  unitNumber: "#01-99",
  description: "A test food stall",
  openingHours: "9 AM - 6 PM",
  cuisineIds: [1]
};
// Test stall management
describe("stall CRUD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("public stall list is available", async () => {
    stallModel.list.mockResolvedValue({
      rows: [{ stallId: 1 }],
      page: 1,
      limit: 20,
      total: 1
    });
    const response = await request(app).get(
      "/api/stalls?centreId=1"
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
  test("vendor creates a stall owned by token identity", async () => {
    stallModel.create.mockResolvedValue({
      stallId: 9,
      ...body
    });
    const response = await request(app)
      .post("/api/stalls")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`)
      .send(body);
    expect(response.status).toBe(201);
    expect(stallModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Stall"
      }),
      2
    );
  });
  test("vendor cannot update another vendor's stall", async () => {
    stallModel.vendorOwns.mockResolvedValue(false);
    const response = await request(app)
      .put("/api/stalls/9")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`)
      .send(body);
    expect(response.status).toBe(403);
  });
});