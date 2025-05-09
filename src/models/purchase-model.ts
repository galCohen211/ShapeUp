import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Enum for allowed plan options
export enum PurchasePlan {
  ONE_DAY = "1_DAY",
  THREE_DAY = "3_DAY",
  FIVE_DAY = "5_DAY",
}

export interface IPurchase extends Document {
  purchaseDate: Date;
  startDate: Date;
  endDate: Date;
  user: Types.ObjectId;
  gym: Types.ObjectId;
  personalCode: string;
  plan: PurchasePlan;
  price: number;
  creditCard: Types.ObjectId;
}

const PurchaseSchema: Schema<IPurchase> = new Schema({
  purchaseDate: { type: Date, default: Date.now, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  gym: { type: Schema.Types.ObjectId, ref: "Gym", required: true },
  personalCode: { type: String, required: true, unique: true },
  plan: { type: String, required: true, enum: Object.values(PurchasePlan) },
  price: { type: Number, required: true },
  creditCard: {
    type: Schema.Types.ObjectId,
    ref: "CreditCard",
    required: true,
  },
});

const Purchase: Model<IPurchase> = mongoose.model<IPurchase>(
  "Purchase",
  PurchaseSchema
);
export default Purchase;
