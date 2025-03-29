import { Request, Response } from "express";
import User, { IUserType } from "../models/user-model";
import Gym from "../models/gym-model";

class AdminController {
  static async getDashboardCounts(_req: Request, res: Response): Promise<void> {
    try {
      const [userCountsByRole, gymCount] = await Promise.all([
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        Gym.countDocuments(),
      ]);

      const roleCounts: Record<IUserType, number> = {
        [IUserType.USER]: 0,
        [IUserType.GYM_OWNER]: 0,
        [IUserType.ADMIN]: 0,
      };

      userCountsByRole.forEach(({ _id, count }) => {
        if (_id in roleCounts) {
          roleCounts[_id as IUserType] = count;
        }
      });

      res.status(200).json({
        userCount: roleCounts[IUserType.USER],
        gymOwnerCount: roleCounts[IUserType.GYM_OWNER],
        adminCount: roleCounts[IUserType.ADMIN],
        gymCount,
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }
}

export default AdminController;
