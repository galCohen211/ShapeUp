import request from "supertest";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import app, { socketIOServer } from "../../server";
import User, { IUserType } from "../../models/user-model";

jest.mock("../../models/user-model");

// This mock replaces the original `verifyToken` function
jest.mock('../../middleware/verifyToken.ts', () => ({
    __esModule: true,
    default: jest.fn(() => (req: any, res: any, next: any) => {
        req.user = { id: "mocked-user-id", role: IUserType.USER };
        next();
    }),
}));

describe("Chat AI Controller Endpoints", () => {
    const userId = new mongoose.Types.ObjectId().toString();

    // images cleanup
    const uploadsDir = path.join(__dirname, "../../uploads");
    const testImages: string[] = [];

    afterAll(async () => {
        await mongoose.disconnect();
        socketIOServer.close();

        for (const testImage of testImages) {
            const filePattern = new RegExp(
                `${testImage.replace(/\.[^/.]+$/, "")}-.*\\.(png|jpg|jpeg)$`
            );
            const files = fs.readdirSync(uploadsDir);
            const matchedFiles = files.filter((file) => filePattern.test(file));

            if (matchedFiles.length > 0) {
                for (const file of matchedFiles) {
                    const filePath = path.join(uploadsDir, file);
                    try {
                        await fs.promises.unlink(filePath);
                    } catch (err) {
                    }
                }
            }
        }
    });

    describe("GET /askChatAi/:id", () => {
        it("should return 200 and the response to the question", async () => {
            const mockGymOwner = {
                _id: userId,
                email: "gymowner@example.com",
                password: "123456",
                firstName: "Gym",
                lastName: "Owner",
                city: "Somewhere",
                role: IUserType.USER,
                favoriteGyms: [],
                avatarUrl: "gym-owner.jpg",
            };

            (User.findById as jest.Mock).mockResolvedValue(mockGymOwner);

            const response = await request(app).post(`/askChatAi/${userId}`).send({ question: "Please give me a workout plan" });
            expect(response.status).toBe(200);
        });

        it("should return 404 if the user asked another question in a short period of time", async () => {
            const mockGymOwner = {
                _id: userId,
                email: "gymowner@example.com",
                password: "123456",
                firstName: "Gym",
                lastName: "Owner",
                city: "Somewhere",
                role: IUserType.USER,
                favoriteGyms: [],
                avatarUrl: "gym-owner.jpg",
            };

            (User.findById as jest.Mock).mockResolvedValue(mockGymOwner);

            const response1 = await request(app).post(`/askChatAi/${userId}`).send({ question: "Please give me a workout plan" });

            expect(response1.status).toBe(200);

            const response2 = await request(app).post(`/askChatAi/${userId}`).send({ question: "Please give me a workout plan" });

            expect(response2.status).toBe(404);
        });
    });
});

