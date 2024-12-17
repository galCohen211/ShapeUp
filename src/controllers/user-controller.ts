import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import {getMessagesBetweenTwoUsers} from "../chat/chat-logic";
import User, { IUserType } from "../models/user-model";


class UserController {
  static async updateUser(req: Request, res: Response): Promise<void> {
    const { password, firstName, lastName, address } = req.body;
    const { userId } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const avatar =
      req.files && "avatar" in req.files
        ? (req.files["avatar"] as Express.Multer.File[])[0]
        : null;

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

      res
        .status(200)
        .json({ message: "User details updated successfully", user });
    } catch (error) {
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
        res.status(403).json({ message: "Unauthorized: Not a USER or GYM-OWNER" });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
    static async GetUserChats(req: Request, res: Response): Promise<void> {
        const {userId1, userId2} = req.query;
    
        const chat = await getMessagesBetweenTwoUsers([userId1 as string, userId2 as string]);
    
        res.status(200).send(chat);
    }
}

export default UserController;
