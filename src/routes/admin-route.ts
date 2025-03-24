import express from "express";
import adminController from "../controllers/admin-controller";
import { IUserType } from "../models/user-model";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

router.get("/dashboardCounts", verifyToken([IUserType.ADMIN]), adminController.getDashboardCounts);

export default router;
