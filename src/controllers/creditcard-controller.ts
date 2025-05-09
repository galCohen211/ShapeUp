import { Request, Response } from "express";
import CreditCard from "../models/creditcard-model";
import { getFromCookie } from "./auth-controller";
import User from "../models/user-model";

function isValidString(string: any): boolean {
  return string && typeof string === "string" && string.trim() !== "";
}

class CreditCardController {
  static async addCreditCard(req: Request, res: Response): Promise<void> {
    try {
      const { creditCardNumber, expirationDate, civ, cardOwnerName } = req.body;
      const userId = (req as any).userId;

      if (!userId) {
        res.status(400).json({ error: "User ID is required." });
        return;
      }

      if (!isValidString(creditCardNumber)) {
        res.status(400).json({ error: "Credit card number is required." });
        return;
      }

      if (!isValidString(expirationDate)) {
        res.status(400).json({ error: "Expiration date is required." });
        return;
      }

      if (!civ || !/^\d{3}$/.test(civ)) {
        res.status(400).json({ error: "CIV must be exactly 3 digits." });
        return;
      }

      if (!isValidString(cardOwnerName)) {
        res.status(400).json({ error: "Card owner name is required." });
        return;
      }


      const card = new CreditCard({
        user: userId,
        creditCardNumber,
        expirationDate,
        civ,
        cardOwnerName
      });

      await card.save();

      await User.findByIdAndUpdate(userId, { creditCard: card._id });

      res.status(201).json({ message: "Card added successfully", creditCard: card });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static async updateCreditCard(req: Request, res: Response): Promise<void> {
    try {
      const { cardId } = req.params;
      const { creditCardNumber, expirationDate, civ, cardOwnerName } = req.body;

      if (!isValidString(creditCardNumber)) {
        res.status(400).json({ error: "Credit card number is required." });
        return;
      }
      if (!isValidString(expirationDate)) {
        res.status(400).json({ error: "Expiration date is required." });
        return;
      }
      if (!civ || !/^\d{3}$/.test(civ)) {
        res.status(400).json({ error: "CIV must be exactly 3 digits." });
        return;
      }
      if (!isValidString(cardOwnerName)) {
        res.status(400).json({ error: "Card owner name is required." });
        return;
      }

      const updatedCard = await CreditCard.findByIdAndUpdate(
        cardId,
        {
          creditCardNumber,
          expirationDate,
          civ,
          cardOwnerName
        },
        { new: true, runValidators: true }
      );

      if (!updatedCard) {
        res.status(404).json({ message: "Card not found." });
        return;
      }

      res.status(200).json({ message: "Updated successfully", creditCard: updatedCard });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static async deleteCreditCard(req: Request, res: Response): Promise<void> {
    try {
      const { cardId } = req.params;
      const deletedCard = await CreditCard.findByIdAndDelete(cardId);

      if (!deletedCard) {
        res.status(404).json({ message: "Card not found." });
        return;
      }

      await User.updateMany({ creditCard: cardId }, { $unset: { creditCard: "" } });

      res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }
}
export default CreditCardController;