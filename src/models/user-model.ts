import mongoose, { Schema, Document, Model, Types } from "mongoose";

export enum IUserType {
  ADMIN = "admin",
  GYM_OWNER = "gym_owner",
  USER = "user",
}

export enum IGender {
  MALE = "male",
  FEMALE = "female",
}

export enum IGymOwnerStatus {
  PENDING = "pending",
  APPROVED = "approved",
  DECLINED = "declined",
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
  chatGptAccess: Date;
  avatarUrl?: string;
  refreshTokens?: string[];
  gymOwnerLicenseImage?: string;
  favoriteGyms: Types.ObjectId[];
  gymOwnerStatus?: IGymOwnerStatus;
  creditCard?: Types.ObjectId;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String },
  city: { type: String },
  role: { type: String, required: true, enum: Object.values(IUserType) },
  birthdate: { type: Date },
  gender: { type: String },
  chatGptAccess: { type: Date },
  avatarUrl: { type: String, required: false },
  refreshTokens: { type: [String], required: false, default: [] },
  gymOwnerLicenseImage: { type: String, required: false },
  favoriteGyms: [{ type: Schema.Types.ObjectId, ref: "Gym" }],
  gymOwnerStatus: {
    type: String,
    enum: Object.values(IGymOwnerStatus),
    required: false,
  },
  creditCard: {
    type: Schema.Types.ObjectId,
    ref: "CreditCard",
    required: false,
  },
});

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
