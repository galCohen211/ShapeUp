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
  "/:purchaseId",
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

export default router;
