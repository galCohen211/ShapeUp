import request from "supertest";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import app, { socketIOServer } from "../../server";
import Gym from "../../models/gym-model";
import { IUserType } from "../../models/user-model";
import { getFromCookie } from "../../controllers/auth-controller";

jest.mock("../../models/gym-model");
jest.mock("../../controllers/auth-controller");

describe("GymController Endpoints", () => {
  const uploadsDir = path.join(__dirname, "../../uploads");
  const testImages: string[] = [];

  afterAll(async () => {
    await mongoose.disconnect();
    socketIOServer.close();
    testImages.forEach((testImage) => {
      const filePattern = new RegExp(
        `${testImage.replace(/\.[^/.]+$/, "")}-.*\\.(png|jpg|jpeg)$`
      );
      const files = fs.readdirSync(uploadsDir);
      const matchedFile = files.find((file) => filePattern.test(file));

      if (matchedFile) {
        const filePath = path.join(uploadsDir, matchedFile);
        fs.unlinkSync(filePath);
      }
    });
  });

  describe("POST /gyms", () => {
    it("should add a new gym successfully", async () => {
      const ownerId = new mongoose.Types.ObjectId();
      const prices = [20, 50, 100];

      (Gym.prototype.save as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "Test Gym",
        city: "Test city",
        description: "Test Description",
        pictures: ["http://localhost/uploads/test-image1.jpg"],
        amountOfReviews: 0,
        owner: ownerId,
        prices,
      });

      const response = await request(app)
        .post("/gyms")
        .field("name", "Test Gym")
        .field("city", "Test city")
        .field("description", "Test Description")
        .field("prices", JSON.stringify(prices))
        .query({ owner: ownerId.toString() })
        .attach("pictures", Buffer.from("image content"), "test-image1.jpg");

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Gym added successfully!");
      expect(response.body.gym).toHaveProperty("prices", prices);
      testImages.push("test-image1.jpg");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/gyms").send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should return 400 if prices array is missing or incorrect", async () => {
      const ownerId = new mongoose.Types.ObjectId();
  
      const response = await request(app)
          .post("/gyms")
          .field("name", "Test Gym")
          .field("city", "Test city")
          .field("description", "Test Description")
          .query({ owner: ownerId.toString() })
          .attach("pictures", Buffer.from("image content"), "test-image1.jpg");
  
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Prices array must contain exactly 3 numbers.");
    });
  });

  describe("GET /gyms/:gymId", () => {
    it("should get gym details by id successfully", async () => {
      const gymId = new mongoose.Types.ObjectId().toString();
      const existingGym = {
        _id: gymId,
        name: "Gym",
        city: "City",
        description: "Description",
        pictures: ["http://localhost/uploads/test-image2.jpg"],
        prices: [20, 50, 100],
      };
      (Gym.findById as jest.Mock).mockResolvedValue(existingGym);
      const response = await request(app).get(`/gyms/${gymId}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Gym extracted successfully");
      expect(response.body.gym).toHaveProperty("prices", [20, 50, 100]);
    });
  });

  describe("PUT /gyms/:gymId", () => {
    it("should update gym details successfully", async () => {
      const gymId = new mongoose.Types.ObjectId().toString();
      const prices = [30, 60, 120];

      const existingGym = {
        _id: gymId,
        name: "Old Gym",
        city: "Old city",
        description: "Old Description",
        pictures: ["http://localhost/uploads/test-image2.jpg"],
        prices: [20, 50, 100],
      };

      (Gym.findById as jest.Mock).mockResolvedValue(existingGym);
      (Gym.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingGym,
        name: "Updated Gym",
        city: "Updated city",
        description: "Updated Description",
        prices,
      });

      const response = await request(app)
        .put(`/gyms/${gymId}`)
        .field("name", "Updated Gym")
        .field("city", "Updated city")
        .field("description", "Updated Description")
        .field("prices", JSON.stringify(prices))
        .field("pictures[]", "http://localhost/uploads/test-image2.jpg");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Gym updated successfully");
      expect(response.body.gym).toHaveProperty("prices", prices);
      expect(response.body.gym).toHaveProperty("name", "Updated Gym");

      // Add the test image to the cleanup list
      testImages.push("test-image2.jpg");
    });

    it("should return 400 if prices array is invalid", async () => {
      const gymId = new mongoose.Types.ObjectId().toString();
  
      const response = await request(app)
          .put(`/gyms/${gymId}`)
          .send({ prices: [30, 60] });
  
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Prices must be an array of exactly 3 numbers.");
    });

    it("should return 404 if gym is not found", async () => {
      const gymId = new mongoose.Types.ObjectId().toString();
      (Gym.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/gyms/${gymId}`)
        .send({ name: "Updated Gym" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Gym not found");
    });

    it("should return 400 for invalid gymId", async () => {
      const response = await request(app)
        .put("/gyms/invalid-id")
        .send({ name: "Updated Gym" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});

// This mock replaces the original `verifyToken` function
jest.mock('../../middleware/verifyToken.ts', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => {
    req.user = { id: "mocked-user-id", role: IUserType.GYM_OWNER };
    next();
  }),
}));

describe("DELETE /gyms/:gymId", () => {
  it("should delete gym successfully", async () => {
    const gymId = new mongoose.Types.ObjectId().toString();
    const ownerId = new mongoose.Types.ObjectId();
    const existingGym = {
      _id: gymId,
      name: "Test Gym",
      city: "Test city",
      description: "Test Description",
      pictures: ["http://localhost/uploads/test-image1.jpg"],
      owner: ownerId,
    };

    // Mock gym lookup and deletion
    (Gym.findById as jest.Mock).mockResolvedValue(existingGym);
    (Gym.findByIdAndDelete as jest.Mock).mockResolvedValue(existingGym);
    (getFromCookie as jest.Mock).mockResolvedValue(ownerId.toString());

    // Mock file system operations
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.unlinkSync = jest.fn();

    const response = await request(app)
      .delete(`/gyms/${gymId}`)
      .set("access_token", "id=" + ownerId);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Gym deleted successfully");
    expect(fs.unlinkSync).toHaveBeenCalledTimes(existingGym.pictures.length); // Check if unlink was called for each image
  });

  it("should return 404 if gym is not found", async () => {
    const gymId = new mongoose.Types.ObjectId().toString();
    (Gym.findById as jest.Mock).mockResolvedValue(null);

    const response = await request(app).delete(`/gyms/${gymId}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Gym not found");
  });

  it("should return 403 if user is not the owner of the gym", async () => {
    const gymId = new mongoose.Types.ObjectId().toString();
    const gymOwnerId = new mongoose.Types.ObjectId();
    const existingGym = {
      _id: gymId,
      owner: gymOwnerId,
    };
    const loggedInUserId = new mongoose.Types.ObjectId();

    (Gym.findById as jest.Mock).mockResolvedValue(existingGym);

    const response = await request(app)
      .delete(`/gyms/${gymId}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden. You don't have access to this resource");
  });

  it("should handle server errors gracefully", async () => {
    const gymId = new mongoose.Types.ObjectId().toString();

    // Simulate an error in Gym.findById
    (Gym.findById as jest.Mock).mockRejectedValue(new Error("Database error"));

    const response = await request(app).delete(`/gyms/${gymId}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
  });
});

describe("GET /gyms/myGyms", () => {
  it("should return the gyms owned by the logged-in user", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const gyms = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Gym 1",
        city: "city 1",
        description: "Description 1",
        pictures: ["http://localhost/uploads/gym1.jpg"],
        owner: ownerId,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Gym 2",
        city: "city 2",
        description: "Description 2",
        pictures: ["http://localhost/uploads/gym2.jpg"],
        owner: ownerId,
      },
    ];

    (getFromCookie as jest.Mock).mockResolvedValue(ownerId.toString());
    (Gym.find as jest.Mock).mockResolvedValue(gyms);

    const response = await request(app)
      .get("/gyms/myGyms")
      .set("access_token", "id=" + ownerId);

    expect(response.status).toBe(200);
    expect(response.body.gyms).toHaveLength(gyms.length);
    expect(response.body.gyms[0]).toHaveProperty("name", "Gym 1");
    expect(response.body.gyms[1]).toHaveProperty("name", "Gym 2");
  });

  it("should return 400 for an invalid user ID format", async () => {
    (getFromCookie as jest.Mock).mockResolvedValue("invalid-user-id");

    const response = await request(app)
      .get("/gyms/myGyms")
      .set("access_token", "id=invalid-user-id");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid user ID format");
  });

});

describe("GET /gyms", () => {
  it("should return all gyms if no owner query parameter is provided", async () => {
    const gyms = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Gym 1",
        city: "city 1",
        description: "Description 1",
        pictures: ["http://localhost/uploads/gym1.jpg"],
        owner: new mongoose.Types.ObjectId(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Gym 2",
        city: "city 2",
        description: "Description 2",
        pictures: ["http://localhost/uploads/gym2.jpg"],
        owner: new mongoose.Types.ObjectId(),
      },
    ];

    (Gym.find as jest.Mock).mockResolvedValue(gyms);
    const response = await request(app).get("/gyms");

    expect(response.status).toBe(200);
    expect(response.body.gyms).toHaveLength(gyms.length);
    expect(response.body.gyms[0]).toHaveProperty("name", "Gym 1");
    expect(response.body.gyms[1]).toHaveProperty("name", "Gym 2");
  });

  it("should return all gyms with prices", async () => {
    const gyms = [
        {
            _id: new mongoose.Types.ObjectId(),
            name: "Gym 1",
            city: "city 1",
            description: "Description 1",
            pictures: ["http://localhost/uploads/gym1.jpg"],
            prices: [15, 45, 90],
            owner: new mongoose.Types.ObjectId(),
        },
        {
            _id: new mongoose.Types.ObjectId(),
            name: "Gym 2",
            city: "city 2",
            description: "Description 2",
            pictures: ["http://localhost/uploads/gym2.jpg"],
            prices: [10, 40, 80],
            owner: new mongoose.Types.ObjectId(),
        },
    ];

    (Gym.find as jest.Mock).mockResolvedValue(gyms);
    const response = await request(app).get("/gyms");

    expect(response.status).toBe(200);
    expect(response.body.gyms).toHaveLength(gyms.length);
    expect(response.body.gyms[0]).toHaveProperty("prices", [15, 45, 90]);
    expect(response.body.gyms[1]).toHaveProperty("prices", [10, 40, 80]);
  });


  it("should return gyms owned by a specific owner when a valid owner ID is provided", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const gyms = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Gym 1",
        city: "city 1",
        description: "Description 1",
        pictures: ["http://localhost/uploads/gym1.jpg"],
        owner: ownerId,
      },
    ];

    (Gym.find as jest.Mock).mockResolvedValue(gyms);
    const response = await request(app).get(`/gyms?owner=${ownerId}`);

    expect(response.status).toBe(200);
    expect(response.body.gyms).toHaveLength(gyms.length);
    expect(response.body.gyms[0]).toHaveProperty("name", "Gym 1");
    expect(response.body.gyms[0].owner).toBe(ownerId.toString());
  });

  describe("GET /gyms/filter", () => {
    it("should return 200 and the filtered gym data", async () => {
      const mockGyms = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          name: "Fitness World",
          city: "New York",
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          name: "Health Hub",
          city: "San Francisco",
        },
      ];

      const searchQuery = "Fitness";

      (Gym.find as jest.Mock).mockImplementation((query) => {
        return Promise.resolve(
          mockGyms.filter((gym) =>
            gym.name.includes(query.$or[0].name.$regex.source)
          )
        );
      });

      const response = await request(app).get(`/gyms/filter?search=${searchQuery}`);

      expect(response.status).toBe(200);
      expect(response.body.gyms).toHaveLength(1); // Expect only one gym to match
      expect(response.body.gyms[0]).toHaveProperty("name", "Fitness World");
    });


    it("should return 404 if no gyms match the search query", async () => {
      const searchQuery = "nonexistent";

      (Gym.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get(`/gyms/filter?search=${searchQuery}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No gyms found matching the search criteria");
    });

    it("should return 400 if the search query is missing", async () => {
      const response = await request(app).get(`/gyms/filter?search=`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should return 500 if there is a server error", async () => {
      (Gym.find as jest.Mock).mockRejectedValue(new Error("Server error"));

      const searchQuery = "error";

      const response = await request(app).get(`/gyms/filter?search=${searchQuery}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });


});
