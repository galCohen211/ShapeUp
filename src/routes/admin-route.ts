import express from "express";
import adminController from "../controllers/admin-controller";
import { IUserType } from "../models/user-model";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

router.get(
  "/dashboardCounts",
  verifyToken([IUserType.ADMIN]),
  adminController.getDashboardCounts
);

router.patch(
  "/updateGymOwnerStatus/:gymOwnerId",
  verifyToken([IUserType.ADMIN]),
  adminController.updateGymOwnerStatus
);

router.get(
  "/getGymOwnersStatus",
  verifyToken([IUserType.ADMIN]),
  adminController.getGymOwnersStatus
);

export default router;
