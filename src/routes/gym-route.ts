import express from "express";
import { body, query, param } from "express-validator";
import upload from "../multer";
import GymController from "../controllers/gym-controller";
import verifyToken from "../middleware/verifyToken";
import { IUserType } from "../models/user-model";

const router = express.Router();

// Add a new gym
router.post(
    "/",
    upload.array("pictures", 5),
    [
        body("name").notEmpty().withMessage("Name is required."),
        body("city").notEmpty().withMessage("city is required."),
        body("description").notEmpty().withMessage("Description is required."),
        query("owner")
            .notEmpty()
            .withMessage("Owner is required.")
            .isMongoId()
            .withMessage("Owner must be a valid MongoDB ObjectId."),
    ],
    GymController.addGym
);

router.put(
    "/:gymId",
    upload.fields([{ name: "pictures", maxCount: 5 }]),
    [
        param("gymId")
            .notEmpty()
            .withMessage("Gym ID is required.")
            .isMongoId()
            .withMessage("Gym ID must be a valid MongoDB ObjectId."),
        body("name").optional(),
        body("city").optional(),
        body("description").optional(),
        body("amountOfReviews")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Reviews must be a non-negative integer."),
        body("pictures")
            .optional()
            .isString()
            .withMessage("At least one picture is required"),
    ],
    GymController.updateGymById
);

router.get(
    "/",
    [
        query("owner")
            .isMongoId()
            .withMessage("Owner ID must be a valid MongoDB ObjectId")
            .optional(),
    ],
    GymController.getGyms
);

router.get(
    "/myGyms",
    verifyToken([IUserType.GYM_OWNER]),
    GymController.getMyGyms
);

router.delete(
    "/:gymId",
    verifyToken([IUserType.GYM_OWNER]),
    GymController.deleteGymById
);

router.get(
    "/filter",
    [
        query("search")
            .notEmpty()
            .withMessage("Search query is required")
            .isString()
            .withMessage("Search query must be a string")
    ],
    GymController.filterGyms
);


/**
 * @swagger
 * /gyms/{gymId}:
 *   get:
 *     summary: Get a gym by ID
 *     description: Retrieves a specific gym by its ID
 *     tags:
 *       - Comment
 *     parameters:
 *       - in: path
 *         name: gymId
 *         required: true
 *         description: The ID of the gym to retrieve
 *         schema:
 *           type: string
 *           example: '60c72b2f5f1b2c001fbcf73f'
 *     responses:
 *       '200':
 *         description: Successfully retrieved the gym
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commentById:
 *                   $ref: '#/components/schemas/Comment'
 *       '400':
 *         description: Bad request or error fetching the comment
 *       '404':
 *         description: Comment not found
 *       '500':
 *         description: Internal server error
 */
router.get("/:gymId", [param("gymId").notEmpty()], GymController.getGymById);

export default router;
