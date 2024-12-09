import request from "supertest";
import app from "../../server";
import Gym from "../../models/gym-model";
import mongoose from "mongoose";

jest.mock("../../models/gym-model");

describe("GymController Endpoints", () => {
    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe("POST /gyms", () => {
        it("should add a new gym successfully", async () => {
            const ownerId = new mongoose.Types.ObjectId();

            // Mock the Gym model's save method
            (Gym.prototype.save as jest.Mock).mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                name: "Test Gym",
                location: "Test Location",
                description: "Test Description",
                pictures: ["http://localhost/uploads/image1.jpg"],
                amountOfReviews: 0,
                owner: ownerId,
            });

            const response = await request(app)
                .post("/gyms")
                .field("name", "Test Gym")
                .field("location", "Test Location")
                .field("description", "Test Description")
                .query({ owner: ownerId.toString() })
                .attach("pictures", Buffer.from("image content"), "image1.jpg");

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Gym added successfully!");
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
                pictures: ["http://localhost/uploads/image1.jpg"],
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
                .field("pictures", "http://localhost/uploads/image1.jpg");

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Gym updated successfully");
            expect(response.body.gym).toHaveProperty("name", "Updated Gym");
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