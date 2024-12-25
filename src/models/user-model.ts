import mongoose, { Schema, Document, Model, Types } from "mongoose";

export enum IUserType {
  ADMIN = "admin",
  GYM_OWNER = "gym_owner",
  USER = "user",
}

export enum IGender {
  MALE = "male",
  FEMALE = "female"
}

interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  street?: string;
  city?: string;
  role: IUserType;
  birthdate?: Date;
  gender?: IGender;
  avatarUrl?: string;
  refreshTokens?: string[];
  gymOwnerLicenseImage?: string;
  favoriteGyms: Types.ObjectId[];
  isChatGptAllowed?: boolean;
}


const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String },
  city: { type: String },
  role: { type: String, enum: Object.values(IUserType), required: true },
  birthdate: { type: Date },
  gender: { type: String },
  avatarUrl: { type: String, required: false },
  refreshTokens: { type: [String], required: false, default: [] },
  gymOwnerLicenseImage: { type: String, required: false },
  favoriteGyms: [{ type: Schema.Types.ObjectId, ref: "Gym" }],
  isChatGptAllowed: { type: Boolean, default: true }
});


const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
