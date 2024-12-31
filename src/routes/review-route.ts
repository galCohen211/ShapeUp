import express from "express";
import { body, query, param } from "express-validator";
import reviewController from "../controllers/review-controller";
import verifyToken from "../middleware/verifyToken";
import { IUserType } from "../models/user-model";

const router = express.Router();

// Add a new review
router.post("/", verifyToken([IUserType.USER]), reviewController.addReview);

// Update a review
router.put("/:reviewId", verifyToken([IUserType.USER]), reviewController.updateReviewById);

// Get all reviews
router.get("/", reviewController.getAllReviews);

// Get all reviews by gym ID
router.get("/:gymId", reviewController.getAllReviewsByGymId);


export default router;
