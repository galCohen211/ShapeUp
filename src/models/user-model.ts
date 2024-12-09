import mongoose, { Schema, Document, Model, Types } from "mongoose";

enum IUserType {
  ADMIN = "admin",
  GYM_OWNER = "gym_owner",
  USER = "user",
}

interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  address: string;
  type: IUserType;
  favoriteGyms: Types.ObjectId[];
  avatarUrl?: string;
}

const UserSchema: Schema<IUser> = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  type: { type: String, required: true },
  favoriteGyms: [{ type: Schema.Types.ObjectId, ref: "Gym" }],
  avatarUrl: { type: String, required: false },
});

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
