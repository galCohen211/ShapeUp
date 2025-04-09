import express from "express";
import { param } from "express-validator";
import creditcardController from "../controllers/creditcard-controller";
import verifyToken from "../middleware/verifyToken";
import { IUserType } from "../models/user-model";

const router = express.Router();

// Add a new creditcard
router.post(
  "/",
  // verifyToken([IUserType.USER]),
  creditcardController.addCreditCard
);

// Update a creditcard
router.put(
  "/:cardId",
  verifyToken([IUserType.USER]),
  [
    param("cardId")
      .notEmpty()
      .withMessage("Card ID is required.")
      .isMongoId()
      .withMessage("Card ID must be a valid MongoDB ObjectId."),
  ],
  creditcardController.updateCreditCard
);

// Delete a creditcard
router.delete(
  "/:cardId",
  verifyToken([IUserType.USER]),
  [
    param("cardId")
      .notEmpty()
      .withMessage("Card ID is required.")
      .isMongoId()
      .withMessage("Card ID must be a valid MongoDB ObjectId."),
  ],
  creditcardController.deleteCreditCard
);

export default router;
