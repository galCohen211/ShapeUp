import request from "supertest";
import app from "../../server";
import Gym from "../../models/gym-model";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

jest.mock("../../models/gym-model");

describe("GymController Endpoints", () => {
    const uploadsDir = path.join(__dirname, "../../uploads");
    const testImages: string[] = [];

    afterAll(async () => {
        await mongoose.disconnect();
        testImages.forEach((file) => {
            const filePath = path.join(uploadsDir, file);
            if (fs.existsSync(filePath)) {
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

            const response = await request(app).put(`/gyms/${gymId}`).send({ name: "Updated Gym" });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Gym not found");
        });

        it("should return 400 for invalid gymId", async () => {
            const response = await request(app).put("/gyms/invalid-id").send({ name: "Updated Gym" });

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    });
});