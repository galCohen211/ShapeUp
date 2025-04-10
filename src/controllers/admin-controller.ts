import { Request, Response } from "express";
import User, { IGymOwnerStatus, IUserType } from "../models/user-model";
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

  static async updateGymOwnerStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { gymOwnerId } = req.params;
      const { status } = req.body;

      // Validate the provided status
      if (!Object.values(IGymOwnerStatus).includes(status)) {
        res.status(400).json({ error: "Invalid gym owner status." });
      }

      // Find the user by ID
      const user = await User.findById(gymOwnerId);

      if (!user) {
        res.status(404).json({ error: "User not found." });
      } else {
        // Check if the user is a gym owner
        if (user.role !== IUserType.GYM_OWNER) {
          res.status(400).json({ error: "User is not a gym owner." });
        }

        // Update the gym owner status
        user.gymOwnerStatus = status;
        await user.save();

        res.status(200).json({
          message: "Gym owner status updated successfully.",
          status: user.gymOwnerStatus,
        });
      }
    } catch (error) {
      console.error("Error updating gym owner status:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

  static async getGymOwnersStatus(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      // Base query to ensure only gym owners are returned
      let query: any = { role: IUserType.GYM_OWNER };

      // If a valid search query is provided, add regex filtering on firstName, lastName, and email
      if (search && typeof search === "string") {
        const searchRegex = new RegExp(search, "i");
        query.$or = [
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
        ];
      }

      // Execute the query with the selected fields
      const gymOwners = await User.find(
        query,
        "firstName lastName email city gymOwnerLicenseImage gymOwnerStatus"
      );

      res.status(200).json(gymOwners);
    } catch (error) {
      console.error("Error fetching gym owners:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  }
}

export default AdminController;
