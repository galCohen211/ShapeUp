import { Request, Response } from "express";
import CreditCard from "../models/creditcard-model";

function isValidString(string: any): boolean {
  return string && typeof string === "string" && string.trim() !== "";
}

class CreditCardController {
  static async addCreditCard(req: Request, res: Response): Promise<void> {
    try {
      const { creditCardNumber, expirationDate, civ, cardOwnerName } = req.body;

      // Basic validations for inputs.
      if (isValidString(creditCardNumber)) {
        res.status(400).json({
          error:
            "Credit card number is required and must be a non-empty string.",
        });
        return;
      }
      if (isValidString(expirationDate)) {
        res.status(400).json({
          error: "Expiration date is required and must be a non-empty string.",
        });
        return;
      }
      if (!civ || !/^\d{3}$/.test(civ)) {
        res
          .status(400)
          .json({ error: "CIV is required and must be exactly 3 digits." });
        return;
      }
      if (isValidString(cardOwnerName)) {
        res.status(400).json({
          error: "Card owner name is required and must be a non-empty string.",
        });
        return;
      }

      const creditCard = new CreditCard({
        creditCardNumber,
        expirationDate,
        civ,
        cardOwnerName,
      });

      await creditCard.save();

      res
        .status(201)
        .json({ message: "Credit card added successfully.", creditCard });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static async updateCreditCard(req: Request, res: Response): Promise<void> {
    try {
      const { cardId } = req.params;
      const { creditCardNumber, expirationDate, civ, cardOwnerName } = req.body;

      // Basic validations for inputs.
      if (!isValidString(creditCardNumber)) {
        res.status(400).json({
          error:
            "Credit card number is required and must be a non-empty string.",
        });
        return;
      }
      if (!isValidString(expirationDate)) {
        res.status(400).json({
          error: "Expiration date is required and must be a non-empty string.",
        });
        return;
      }
      if (!civ || !/^\d{3}$/.test(civ)) {
        res
          .status(400)
          .json({ error: "CIV is required and must be exactly 3 digits." });
        return;
      }
      if (!isValidString(cardOwnerName)) {
        res.status(400).json({
          error: "Card owner name is required and must be a non-empty string.",
        });
        return;
      }

      // Use { new: true, runValidators: true } to return the updated object and check validations.
      const updatedCreditCard = await CreditCard.findByIdAndUpdate(
        cardId,
        {
          creditCardNumber,
          expirationDate,
          civ,
          cardOwnerName,
        },
        { new: true, runValidators: true }
      );

      if (!updatedCreditCard) {
        res.status(404).json({ message: "Credit card not found." });
        return;
      }

      res.status(200).json({
        message: "Credit card updated successfully.",
        creditCard: updatedCreditCard,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static async deleteCreditCard(req: Request, res: Response): Promise<void> {
    try {
      const { cardId } = req.params;
      const deletedCard = await CreditCard.findByIdAndDelete(cardId);

      if (!deletedCard) {
        res.status(404).json({ message: "Credit card not found." });
        return;
      }

      res.status(200).json({ message: "Credit card deleted successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }
}

export default CreditCardController;
