import request from "supertest";
import app from "../../server";
import User from "../../models/user-model";
import mongoose from "mongoose";
import path from "path";


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
  describe("POST /signup", () => {
    it("should return 201 user created successfully", async () => {

      (User.prototype.save as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: "johndoe123@gmail.com",
        password: "12345",
        firstName: "John",
        lastName: "Doe",
        address: "ono",
        avatar: ["http://localhost/uploads/test-image1.jpg"]
      });

      const response = await request(app)
        .post("/users/signup")
        .field("email", "johndoe123@gmail.com")
        .field("password", "12345")
        .field("firstName", "John")
        .field("lastName", "Doe")
        .field("address", "ono")
        .attach("avatar", Buffer.from("image content"), "test-image1.jpg");

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.email).toBe("johndoe123@gmail.com");
    });
  });

  describe("POST /login", () => {
    it("should login an existing user with correct credentials", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: "test@example.com",
        password: "$2a$10$KIXK1m.kjG1Y7P6b1Fl5kuN4xLrQk5O44v8xR7dsb/EKkN4NCAXSi", // bcrypt hash for "password123"
        firstName: "Test",
        lastName: "User",
        address: "123 Test Street",
        type: "USER",
        avatarUrl: "http://example.com/avatar.jpg",
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const bcrypt = require("bcryptjs");
      bcrypt.compare = jest.fn().mockResolvedValue(true); // Password match

      const response = await request(app)
        .post("/users/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.email).toBe("test@example.com");
    });

  });
