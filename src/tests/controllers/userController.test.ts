import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

import app from "../../server";
import User from "../../models/user-model";

jest.mock("../../models/user-model");

describe("UserController Endpoints", () => {
  const userId = new mongoose.Types.ObjectId().toString();

  // images cleanup
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
        address: "First street",
        avatar: ["http://localhost/uploads/test-image1.jpg"],
        refreshTokens: [],
        save: jest.fn().mockResolvedValue(true),
      });

      const response = await request(app)
        .post("/users/signup")
        .field("email", "johndoe123@gmail.com")
        .field("password", "12345")
        .field("firstName", "John")
        .field("lastName", "Doe")
        .field("address", "First street")
        .attach("avatar", Buffer.from("image content"), "test-image1.jpg");

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.email).toBe("johndoe123@gmail.com");

      testImages.push("test-image1.jpg");
    });
  });

  describe("POST /login", () => {

    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "johndoe123@gmail.com",
      password: "$2b$12$kiwSU0JHcdsDVJLOxDD2AekohHwS5RVU8E5wZerlnFE7/Jibvr10W", // bcrypt for 12345
      firstName: "John",
      lastName: "Doe",
      address: "First Street",
      type: "USER",
      avatarUrl: "http://example.com/avatar.jpg",
      refreshTokens: [],
      save: jest.fn().mockResolvedValue(true),
    };

    it("should login an existing user with correct credentials and return 200", async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true); // check if password match

      const response = await request(app)
        .post("/users/login")
        .send({
          email: "johndoe123@gmail.com",
          password: "12345",
        });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.email).toBe("johndoe123@gmail.com");
    });

    it("should return 401 for incorrect password", async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false); // Password mismatch

      const response = await request(app)
        .post("/users/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.text).toBe("Wrong email or password");
    });

    it("should return 401 if user does not exist", async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post("/users/login")
        .send({
          email: "idontexist@gmail.com",
          password: "12345",
        });

      expect(response.status).toBe(401);
      expect(response.text).toBe("Wrong email or password");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({
          email: "",
          password: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

});
