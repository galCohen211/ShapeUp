import request from "supertest";
import app from "../../server";
import User from "../../models/user-model"; // Update this import based on your project structure
import mongoose from "mongoose";

jest.mock("../../models/user-model");

describe("UserController Endpoints", () => {
  const userId = new mongoose.Types.ObjectId().toString();

  describe("GET /users/user/:userId", () => {
    it("should return 200 and the user data for a gym owner", async () => {
      const mockGymOwner = {
        _id: userId,
        email: "gymowner@example.com",
        password: "123456",
        firstName: "Gym",
        lastName: "Owner",
        address: "Somewhere",
        type: "gym_owner",
        favoriteGyms: [],
        avatarUrl: "gym-owner.jpg",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockGymOwner);

      const response = await request(app).get(`/users/user/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("email", "gymowner@example.com");
      expect(response.body.type).toBe("gym_owner");
    });

    it("should return 404 if user is not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get(`/users/user/${userId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 500 if there is a server error", async () => {
      (User.findById as jest.Mock).mockRejectedValue(new Error("Server error"));

      const response = await request(app).get(`/users/user/${userId}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Server error");
    });
  });

  describe("GET /users/user/:userId", () => {
    it("should return 200 and the user data for a regular user", async () => {
      const mockUser = {
        _id: userId,
        email: "user@example.com",
        password: "123456",
        firstName: "Regular",
        lastName: "User",
        address: "Somewhere",
        type: "user",
        favoriteGyms: [],
        avatarUrl: "user.jpg",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get(`/users/user/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("email", "user@example.com");
      expect(response.body.type).toBe("user");
    });

    it("should return 403 if the user is not a regular user or gym owner", async () => {
      const mockGymOwner = {
        _id: userId,
        email: "gymowner@example.com",
        password: "123456",
        firstName: "Gym",
        lastName: "Owner",
        address: "Somewhere",
        type: "bla",
        favoriteGyms: [],
        avatarUrl: "gym-owner.jpg",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockGymOwner);

      const response = await request(app).get(`/users/user/${userId}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Unauthorized: Not a USER or GYM-OWNER");
    });
  });
});
