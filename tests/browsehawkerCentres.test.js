jest.mock("../models/browsehawkercentreModel");
jest.mock("../models/stallModel");
const request = require("supertest");
const app = require("../app");
const hawkerCentreModel = require("../models/browsehawkerCentreModel");
const stallModel = require("../models/stallModel");
// Test public hawker centre features
describe("public centre and stall retrieval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("searches centres", async () => {
    hawkerCentreModel.list.mockResolvedValue({
      rows: [
        {
          centreId: 1,
          name: "Clementi Centre"
        }
      ],
      page: 1,
      limit: 20,
      total: 1
    });
    const response = await request(app).get(
      "/api/hawker-centres?search=Clementi"
    );
    expect(response.status).toBe(200);
    expect(response.body.data[0].name).toContain("Clementi");
  });
  test("returns 404 for missing centre", async () => {
    hawkerCentreModel.findById.mockResolvedValue(null);
    const response = await request(app).get(
      "/api/hawker-centres/999"
    );
    expect(response.status).toBe(404);
  });
  test("retrieves centre stalls", async () => {
    hawkerCentreModel.findById.mockResolvedValue({
      centreId: 1
    });
    stallModel.list.mockResolvedValue({
      rows: [{ stallId: 1 }],
      total: 1
    });
    const response = await request(app).get(
      "/api/hawker-centres/1/stalls"
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
});