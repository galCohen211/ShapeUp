import request from "supertest";
import app from "../../server";
import Gym from "../../models/gym-model";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { getFromCookie } from "../../controllers/auth-controller";

jest.mock("../../models/gym-model");
jest.mock("../../controllers/auth-controller");

describe("GymController Endpoints", () => {
  const uploadsDir = path.join(__dirname, "../../uploads");
  const testImages: string[] = [];

  afterAll(async () => {
    await mongoose.disconnect();
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

      (Gym.prototype.save as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "Test Gym",
        location: "Test Location",
        description: "Test Description",
        pictures: ["http://localhost/uploads/test-image1.jpg"],
        amountOfReviews: 0,
        owner: ownerId,
      });

      const response = await request(app)
        .post("/gyms")
        .field("name", "Test Gym")
        .field("location", "Test Location")
        .field("description", "Test Description")
        .query({ owner: ownerId.toString() })
        .attach("pictures", Buffer.from("image content"), "test-image1.jpg");

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Gym added successfully!");

      testImages.push("test-image1.jpg");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/gyms").send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("PUT /gyms/:gymId", () => {
    it("should update gym details successfully", async () => {
      const gymId = new mongoose.Types.ObjectId().toString();
      const existingGym = {
        _id: gymId,
        name: "Old Gym",
        location: "Old Location",
        description: "Old Description",
        pictures: ["http://localhost/uploads/test-image2.jpg"],
      };

      (Gym.findById as jest.Mock).mockResolvedValue(existingGym);
      (Gym.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingGym,
        name: "Updated Gym",
        location: "Updated Location",
        description: "Updated Description",
      });

      const response = await request(app)
        .put(`/gyms/${gymId}`)
        .field("name", "Updated Gym")
        .field("location", "Updated Location")
        .field("description", "Updated Description")
        .field("pictures", "http://localhost/uploads/test-image2.jpg");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Gym updated successfully");
      expect(response.body.gym).toHaveProperty("name", "Updated Gym");

      // Add the test image to the cleanup list
      testImages.push("test-image2.jpg");
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
      expect(response.body.errors).toBeDefined();
    });
  });
});

describe("DELETE /gyms/:gymId", () => {
  it("should delete gym successfully", async () => {
    const gymId = new mongoose.Types.ObjectId().toString();
    const ownerId = new mongoose.Types.ObjectId();
    const existingGym = {
      _id: gymId,
      name: "Test Gym",
      location: "Test Location",
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
    expect(response.body.message).toBe(
      "Forbidden. You don't have access to this resource"
    );
  });

  it("should handle server errors gracefully", async () => {
    const gymId = new mongoose.Types.ObjectId().toString();

    // Simulate an error in Gym.findById
    (Gym.findById as jest.Mock).mockRejectedValue(new Error("Database error"));

    const response = await request(app).delete(`/gyms/${gymId}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      "An error occurred while deleting the gym."
    );
  });
});
