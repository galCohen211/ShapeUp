import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IReview extends Document {
  _id: Types.ObjectId;
  rating: number;
  content: string;
  user: Types.ObjectId;
  gym: Types.ObjectId;
}

const ReviewSchema: Schema<IReview> = new mongoose.Schema({
  rating: { type: Number, required: true },
  content: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  gym: { type: Schema.Types.ObjectId, ref: "Gym", required: true },
});

const Review: Model<IReview> = mongoose.model<IReview>(
  "Review",
  ReviewSchema
);
export default Review;
