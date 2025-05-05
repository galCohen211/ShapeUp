import { Request, Response } from "express";
import Purchase, { PurchasePlan, IPurchase } from "../models/purchase-model";
import { getFromCookie } from "./auth-controller";
import { addDays } from "date-fns";
import CreditCard from "../models/creditcard-model";
import User from "../models/user-model";
import Gym from "../models/gym-model";

// Generates a unique 6-digit code, checking for collisions in the Purchase collection.
async function generateUniquePersonalCode(): Promise<string> {
  const maxAttempts = 10;
  let code: string;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    // Check if a purchase with this personal code already exists.
    const exists = await Purchase.findOne({ personalCode: code });
    if (!exists) {
      return code;
    }
  }
  throw new Error(
    "Unable to generate a unique personal code after multiple attempts."
  );
}

class PurchaseController {
  static async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, gymId, plan } = req.body;
      // Obtain the user from cookies.
      const userId = await getFromCookie(req, res, "id");

      // Validate required parameters.
      if (!userId) {
        res.status(400).json({ error: "User id is required." });
        return;
      }
      if (!startDate) {
        res.status(400).json({ error: "Start date is required." });
        return;
      }
      if (!gymId) {
        res.status(400).json({ error: "Gym ID is required." });
        return;
      }
      if (!plan || !Object.values(PurchasePlan).includes(plan)) {
        res.status(400).json({
          error: `A valid plan is required. Allowed values: ${Object.values(
            PurchasePlan
          ).join(", ")}`,
        });
        return;
      }
      const creditCard = await CreditCard.findOne({ user: userId });
      if (!creditCard) {
        res.status(400).json({ error: "No credit card found for this user." });
        return;
      }

      // Parse the start date.
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        res.status(400).json({ error: "Invalid start date format." });
        return;
      }

      // Map plan enum to the number of days.
      let daysToAdd = 0;
      switch (plan) {
        case PurchasePlan.ONE_DAY:
          daysToAdd = 1;
          break;
        case PurchasePlan.THREE_DAY:
          daysToAdd = 3;
          break;
        case PurchasePlan.FIVE_DAY:
          daysToAdd = 5;
          break;
        default:
          res.status(400).json({ error: "Invalid plan option." });
          return;
      }

      daysToAdd = daysToAdd - 1; // Adjust for inclusive end date.

      const gym = await Gym.findById(gymId);
      if (!gym) {
        res.status(400).json({ error: "Gym not found." });
        return;
      }

      // Calculate end date using date-fns addDays.
      const endDate = addDays(parsedStartDate, daysToAdd);

      // Generate a unique 6-digit personal code (collision checked).
      const personalCode = await generateUniquePersonalCode();

      const newPurchase: IPurchase = new Purchase({
        startDate: parsedStartDate,
        endDate,
        user: userId,
        gym: gymId,
        personalCode,
        plan,
        creditCard: creditCard._id,
      });

      await newPurchase.save();

      if (gym) {
        let date = parsedStartDate;
        while (date <= endDate) {
          const key = date.toISOString().split("T")[0];
          gym.trainerCounts[key] = (gym.trainerCounts[key] || 0) + 1;
          date = addDays(date, 1);
        }

        console.log("Gym trainer counts updated:", gym.trainerCounts);
        gym.markModified("trainerCounts");
        await gym.save();
      }

      res.status(200).json({
        message: "Transaction created successfully.",
        personalCode,
        purchaseId: newPurchase._id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error,
      });
    }
  }

  // Retrieves the personal code of a purchase given its ID.
  static async getPersonalCode(req: Request, res: Response): Promise<void> {
    try {
      const { purchaseId } = req.params;
      const purchase = await Purchase.findById(purchaseId);

      if (!purchase) {
        res.status(404).json({ message: "Purchase not found." });
        return;
      }

      res.status(200).json({
        personalCode: purchase.personalCode,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error,
      });
    }
  }

  static async getMyPurchases(req: Request, res: Response): Promise<void> {
    try {
      const userId = await getFromCookie(req, res, "id");

      if (!userId) {
        res.status(400).json({ error: "User ID is required." });
        return;
      }

      const purchases = await Purchase.find({ user: userId })
        .populate("gym", "name _id")
        .select("startDate endDate personalCode gym");

      const formatted = purchases.map(purchase => ({
        startDate: purchase.startDate,
        endDate: purchase.endDate,
        personalCode: purchase.personalCode,
        gym: {
          _id: (purchase.gym as any)?._id,
          name: (purchase.gym as any)?.name || "Unknown Gym",
        }
      }));
      
      res.status(200).json({ purchases: formatted });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error", error });
    }
  }
}

export default PurchaseController;
