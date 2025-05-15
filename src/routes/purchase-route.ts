import express from "express";
import { param } from "express-validator";
import purchaseController from "../controllers/purchase-controller";
import verifyToken from "../middleware/verifyToken";
import { IUserType } from "../models/user-model";

const router = express.Router();

// Create purchase
router.post(
  "/",
  verifyToken([IUserType.USER]),
  purchaseController.createTransaction
);

// Get a purchase personal code
router.get(
  "/personalCode/:purchaseId",
  verifyToken([IUserType.USER]),
  [
    param("purchaseId")
      .notEmpty()
      .withMessage("Purchase ID is required.")
      .isMongoId()
      .withMessage("Purchase ID must be a valid MongoDB ObjectId."),
  ],
  purchaseController.getPersonalCode
);

router.get(
  "/myPurchases",
  verifyToken([IUserType.USER]),
  purchaseController.getMyPurchases
);

router.get(
  "/getGymOwnerPurchases",
  verifyToken([IUserType.GYM_OWNER]),
  purchaseController.getGymOwnerPurchases
);

router.get(
  "/getGymPurchaseInsights/:gymId",
  verifyToken([IUserType.GYM_OWNER]),
  [
    param("gymId")
      .notEmpty()
      .withMessage("Gym ID is required.")
      .isMongoId()
      .withMessage("Gym ID must be a valid MongoDB ObjectId."),
  ],
  purchaseController.getGymPurchaseInsights
);

export default router;
