import Review from "../models/review-model";
import { Request, Response } from "express";
import { getFromCookie } from "./auth-controller";
import Gym from "../models/gym-model";
import User from "../models/user-model";

class reviewController {
    static async addReview(req: Request, res: Response): Promise<void> {
        try {
            const { rating, content, gym } = req.body;
            const commenterUserId = await getFromCookie(req, res, "id") as string;

            if (!commenterUserId) {
                res.status(401).json({ error: "Unauthorized: User ID is missing." });
                return;
            }

            if (!rating || rating < 1 || rating > 5) {
                res.status(400).json({ error: "Rating must be between 1 and 5." });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(400).json({ error: "Content cannot be empty." });
                return;
            }

            if (!gym) {
                res.status(400).json({ error: "Gym ID is required." });
                return;
            }

            const existingGym = await Gym.findById(gym);
            if (!existingGym) {
                res.status(404).json({ message: "Gym not found" });
                return;
            }

            const existingUser = await User.findById(commenterUserId);
            if (!existingUser) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            const review = new Review({
                rating,
                content,
                user: commenterUserId,
                gym,
            });
            await review.save();

            res.status(201).json({ message: "Review added successfully.", review });
            return;
        } catch (err) {
            res.status(500).json({ message: "An error occurred while adding the review.", error: err });
            return;
        }
    }

    static async updateReviewById(req: Request, res: Response): Promise<void> {
        try {
            const { reviewId } = req.params;
            const { rating, content } = req.body;
            const commenterUserId = await getFromCookie(req, res, "id") as string;

            if (!commenterUserId) {
                res.status(401).json({ error: "Unauthorized: User ID is missing." });
                return;
            }

            if (!rating || rating < 1 || rating > 5) {
                res.status(400).json({ error: "Rating must be between 1 and 5." });
                return;
            }

            if (!content || content.trim().length === 0) {
                res.status(400).json({ error: "Content cannot be empty." });
                return;
            }
            const review = await Review.findByIdAndUpdate(reviewId, { rating, content }, { new: true });


            res.status(200).json({ message: "Review updated successfully.", review });
            return;

        } catch (err) {
            res.status(500).json({ message: "An error occurred while updating the review.", error: err });
            return;
        }

    }

    static async getAllReviews(req: Request, res: Response): Promise<void> {
        try {
            const reviews = await Review.find();
            res.status(200).json({ reviews });
            return;
        } catch (err) {
            res.status(500).json({ message: "An error occurred while fetching reviews.", error: err });
            return;
        }
    }

}

export default reviewController;
