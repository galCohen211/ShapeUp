import express, { Request, Response } from "express";
import createGymsAndUsers from "../scripts/initialize-data"; // Adjust the path to your file
const router = express.Router();

// Default route to initialize gyms and users
router.get("/initialize-data", async (_req: Request, res: Response) => {
  try {
    await createGymsAndUsers();
    res.status(200).send("Gyms, users, and comments created successfully!");
  } catch (error) {
    console.error("Error initializing data:", error);
    res.status(500).send("An error occurred while initializing data.");
  }
});

export default router;
