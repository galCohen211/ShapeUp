import { connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://localhost:27017/shape_up_dev";

// run this when the server is starting
export async function connectDb() {
  try {
    await connect(MONGO_URL);
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit process with failure
  }
}
