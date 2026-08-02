jest.mock("../models/menuItemModel");
jest.mock("../models/stallModel");
const request = require("supertest");
const app = require("../app");
const { token } = require("./helpers");
const menuItemModel = require("../models/menuItemModel");
const stallModel = require("../models/stallModel");
const body = {
  stallId: 1,
  name: "Rice",
  category: "Main",
  description: "Useful description",
  price: 4.5,
  preparationMinutes: 8,
  isAvailable: true,
  cuisineIds: [1, 2],
  addOns: []
};
// Test menu items and vendor ownership
describe("menu item CRUD and ownership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stallModel.vendorOwns.mockResolvedValue(true);
  });
  test("public list works", async () => {
    menuItemModel.list.mockResolvedValue({
      rows: [],
      page: 1,
      limit: 20,
      total: 0
    });
    const response = await request(app).get("/api/menu-items");
    expect(response.status).toBe(200);
  });
  test("vendor creates for owned stall", async () => {
    menuItemModel.create.mockResolvedValue({
      menuItemId: 1,
      ...body
    });
    const response = await request(app)
      .post("/api/menu-items")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`)
      .send(body);
    expect(response.status).toBe(201);
  });
  test("invalid price is rejected before model", async () => {
    const response = await request(app)
      .post("/api/menu-items")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`)
      .send({
        ...body,
        price: 0
      });
    expect(response.status).toBe(400);
    expect(menuItemModel.create).not.toHaveBeenCalled();
  });
  test("another vendor is forbidden", async () => {
    stallModel.vendorOwns.mockResolvedValue(false);
    const response = await request(app)
      .post("/api/menu-items")
      .set("Authorization", `Bearer ${token(3, "Vendor")}`)
      .send(body);
    expect(response.status).toBe(403);
  });
});