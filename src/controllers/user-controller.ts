import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { ObjectId } from "mongoose";
import { getMessagesBetweenTwoUsers } from "../chat/chat-logic";
import User, { IUserType } from "../models/user-model";
import Gym from "../models/gym-model";

import { getFromCookie } from "./auth-controller";


class UserController {
  static async updateUserById(req: Request, res: Response): Promise<void> {
    const { firstName, lastName, street, city } = req.body;
    const { userId } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation array is not empty", error: errors.array() });
      return;
    }

    const avatar = req.files && "avatar" in req.files ? (req.files["avatar"] as Express.Multer.File[])[0] : null;

    try {
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Handle avatar replacement
      let avatarUrl = user.avatarUrl;
      if (avatar) {
        UserController.deleteOldAvatar(user.avatarUrl);
        avatarUrl = `/uploads/${avatar.filename}`;
      }

      // Update user fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (city) user.city = city;
      if (street) user.street = street;
      if (avatarUrl) user.avatarUrl = avatarUrl;

      await user.save();

      res.status(200).json({ message: "User details updated successfully", user });
    }
    catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static deleteOldAvatar(avatarUrl?: string): void {
    if (!avatarUrl) return;

    // Construct the full path to the avatar file on the server
    const oldAvatarPath = path.resolve(
      __dirname,
      "../..",
      "src",
      "uploads",
      path.basename(avatarUrl)
    );
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (user.role !== IUserType.USER && user.role !== IUserType.GYM_OWNER) {
        res.status(403).json({ message: "Forbidden: Not a USER or GYM-OWNER" });
        return;
      }

      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static async deleteUserById(req: Request, res: Response): Promise<void> {
    try {
        const { userId } = req.params;
        const cookie_user_id = await getFromCookie(req, res, "id");
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json({ message: "Validation array is not empty", error: errors.array() });
          return;
        }
        let user = await User.findById(userId);

        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        if (user.role !== IUserType.ADMIN && userId !== cookie_user_id) {
          res.status(403).json({ message: "Forbidden operation" });
          return;
        }

        user = await User.findByIdAndDelete(userId);
        if (user) {
          res.status(200).json({ message: "User deleted successfully" });
            return;
        }
          res.status(404).json({ message: "User not found"});
        } catch (err) {
          res.status(500).json({ message: "Internal Server Error", error: err });
    }
  }

  static async addFavoriteGym(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { gymId } = req.body;

    try {
      const gym = await Gym.findById(gymId);
      if (!gym) {
        res.status(404).json({ message: "Gym not found" });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      if (user.favoriteGyms.includes(gymId)) {
        res.status(400).json({ message: "Gym already in favorites" });
        return;
      }
      user.favoriteGyms.push(gymId);
      await user.save();

      res.status(200).json({
        message: "Gym added to favorites successfully",
        favoriteGyms: user.favoriteGyms,
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static async filterUsers(req: Request, res: Response): Promise<void> {
    const { search } = req.query;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation array is not empty", error: errors.array() });
      return;
    }

    if (!search || typeof search !== "string") {
      res.status(400).json({ message: "Search query is required and must be a string" });
      return;
    }

    try {
      const searchRegex = new RegExp(search, "i");

      // Perform a case-insensitive search using regular expressions on the firstName, lastName, and email fields
      // of the User collection to find users that match the search query.
      const users = await User.find({
        $or: [
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } }
        ]
      });

      if (users.length === 0) {
        res.status(404).json({ message: "No users found matching the search criteria" });
        return;
      }

      res.status(200).json({ users });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  }

  static async getUserChats(req: Request, res: Response): Promise<void> {
    const { userId1, userId2 } = req.query;
    const chat = await getMessagesBetweenTwoUsers([(userId1 as unknown) as ObjectId, (userId2 as unknown) as ObjectId]);

    res.status(200).send(chat);
  }
}

export default UserController;