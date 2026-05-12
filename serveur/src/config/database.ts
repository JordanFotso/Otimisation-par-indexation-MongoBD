import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/optimisation";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("[database]: Connected to MongoDB");
  } catch (error) {
    console.error("[database]: MongoDB connection error:", error);
    process.exit(1);
  }
};
