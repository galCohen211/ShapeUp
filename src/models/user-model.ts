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
  type: IUserType;
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
});


const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
