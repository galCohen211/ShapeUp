import express from "express";
import { body, query, param } from "express-validator";
import GymController from "../controllers/gym-controller";
import upload from "../multer";


const router = express.Router();

// Add a new gym
router.post("/", upload.array("pictures", 5),
    [
        body("name")
            .notEmpty().withMessage("Name is required."),
        body("location")
            .notEmpty().withMessage("Location is required."),
        body("description")
            .notEmpty().withMessage("Description is required."),
        query("owner")
            .notEmpty().withMessage("Owner is required.")
            .isMongoId().withMessage("Owner must be a valid MongoDB ObjectId."),
    ],
    GymController.addGym
);

router.put("/:gymId", upload.fields([{ name: "pictures", maxCount: 5 }]),
    [
        param("gymId")
            .notEmpty().withMessage("Gym ID is required.")
            .isMongoId().withMessage("Gym ID must be a valid MongoDB ObjectId."),
        body("name").optional(),
        body("location").optional(),
        body("description").optional(),
        body("amountOfReviews").optional().isInt({ min: 0 }).withMessage("Reviews must be a non-negative integer."),
        body("pictures").optional().isString().withMessage("At least one picture is required"),
    ],
    GymController.updateGym
);
export default router;