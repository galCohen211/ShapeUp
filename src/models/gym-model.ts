import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IGym extends Document {
  _id: Types.ObjectId;
  name: string;
  pictures: string[];
  city: string;
  description: string;
  owner: Types.ObjectId;
  prices: number[];
  trainerCounts: Record<string, number>;
}

const GymSchema: Schema<IGym> = new mongoose.Schema({
  name: { type: String, required: true },
  pictures: { type: [String], required: true },
  city: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  prices: {
    type: [Number],
    required: true
  },
  trainerCounts: {
    type: Object,
    default: {},
  },
});

const Gym: Model<IGym> = mongoose.model<IGym>("Gym", GymSchema);
export default Gym;
