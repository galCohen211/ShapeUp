import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import {getMessagesBetweenTwoUsers} from "../chat/chat-logic";
import User, { IUserType } from "../models/user-model";
import Gym from "../models/gym-model";

import { ObjectId } from "mongoose";


class UserController {
  static async updateUserById(req: Request, res: Response): Promise<void> {
    const { password, firstName, lastName, address } = req.body;
    const { userId } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
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
      if (address) user.address = address;
      if (avatarUrl) user.avatarUrl = avatarUrl;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
      await user.save();

      res.status(200).json({ message: "User details updated successfully", user });
    }
    catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
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

      if (user.type !== IUserType.USER && user.type !== IUserType.GYM_OWNER) {
        res.status(403).json({ message: "Forbidden: Not a USER or GYM-OWNER" });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
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
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async filterUsers(req: Request, res: Response): Promise<void> {
    const { search } = req.query;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
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
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

    static async GetUserChats(req: Request, res: Response): Promise<void> {
        const {userId1, userId2} = req.query;
        const chat = await getMessagesBetweenTwoUsers([(userId1 as unknown) as ObjectId, (userId2 as unknown) as ObjectId]);
    
        res.status(200).send(chat);
    }
}

export default UserController;