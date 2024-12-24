import mongoose, { Schema, Document, Model, Types } from "mongoose";

export enum IUserType {
  ADMIN = "admin",
  GYM_OWNER = "gym_owner",
  USER = "user",
}

interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  street?: string; 
  role: IUserType;
  favoriteGyms: Types.ObjectId[];
  avatarUrl?: string;
  gymOwnerLicenseImage?: string;
  refreshTokens?: string[];
  birthdate?: Date;
  gender?: string;
  city?: string; 
  isChatGptAllowed?: boolean;
}


const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  street: { type: String }, 
  birthdate: { type: Date }, 
  gender: { type: String, enum: ['Male', 'Female'] }, 
  city: { type: String },
  isChatGptAllowed: { type: Boolean, default: true },
  role: { type: String, required: true },
  avatarUrl: { type: String, required: false },
  gymOwnerLicenseImage: { type: String, required: false },
  refreshTokens: { type: [String], required: false, default: [] },
  favoriteGyms: [{ type: Schema.Types.ObjectId, ref: "Gym" }]
});


const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
