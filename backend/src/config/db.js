// ─── config/db.js — MongoDB Connection ───────────────────────────────────────
import mongoose from "mongoose";
import "dotenv/config";


const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/quiziq";

  await mongoose.connect(uri, {
    // Mongoose 8 handles these automatically, but explicit is clear
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });
};

export default connectDB;
