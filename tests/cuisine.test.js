jest.mock("../models/cuisineModel");

const request = require("supertest");
const app = require("../app");
const { token } = require("./helpers");
const cuisineModel = require("../models/cuisineModel");

describe("cuisine CRUD and permissions", () => {
  beforeEach(() => jest.clearAllMocks());

  test("public users can retrieve cuisines", async () => {
    cuisineModel.list.mockResolvedValue([{ cuisineId: 1, name: "Chinese" }]);
    const response = await request(app).get("/api/cuisines");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  test("Administrator creates a cuisine", async () => {
    cuisineModel.create.mockResolvedValue({ cuisineId: 11, name: "Thai" });
    const response = await request(app)
      .post("/api/cuisines")
      .set("Authorization", `Bearer ${token(5, "Administrator")}`)
      .send({ name: "Thai" });
    expect(response.status).toBe(201);
  });

  test("Vendor cannot create a cuisine", async () => {
    const response = await request(app)
      .post("/api/cuisines")
      .set("Authorization", `Bearer ${token(2, "Vendor")}`)
      .send({ name: "Thai" });
    expect(response.status).toBe(403);
  });

  test("Administrator updates a cuisine", async () => {
    cuisineModel.findById.mockResolvedValue({ cuisineId: 11, name: "Thai" });
    cuisineModel.update.mockResolvedValue({ cuisineId: 11, name: "Thai Cuisine" });
    const response = await request(app)
      .put("/api/cuisines/11")
      .set("Authorization", `Bearer ${token(5, "Administrator")}`)
      .send({ name: "Thai Cuisine" });
    expect(response.status).toBe(200);
  });

  test("Administrator deletes an unused cuisine", async () => {
    cuisineModel.remove.mockResolvedValue(1);
    const response = await request(app)
      .delete("/api/cuisines/11")
      .set("Authorization", `Bearer ${token(5, "Administrator")}`);
    expect(response.status).toBe(200);
  });
});
