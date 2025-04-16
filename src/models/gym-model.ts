import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface DailyHours {
  from: string;
  to: string;
}

interface IGym extends Document {
  _id: Types.ObjectId;
  name: string;
  pictures: string[];
  city: string;
  description: string;
  owner: Types.ObjectId;
  prices: number[];
  trainerCounts: Record<string, number>;
  openingHours: {
    sundayToThursday: DailyHours;
    friday: DailyHours;
    saturday: DailyHours;
  };
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:mm" 24-hour format

const dailyHoursSchema = {
  from: {
    type: String,
    required: true,
    match: [timeRegex, "Time must be in HH:mm format"],
  },
  to: {
    type: String,
    required: true,
    match: [timeRegex, "Time must be in HH:mm format"],
  },
};

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
  openingHours: {
    sundayToThursday: { type: dailyHoursSchema, required: true },
    friday: { type: dailyHoursSchema, required: true },
    saturday: { type: dailyHoursSchema, required: true },
  },
});

const Gym: Model<IGym> = mongoose.model<IGym>("Gym", GymSchema);
export default Gym;
