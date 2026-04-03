// ─── models/QuizSession.model.js ─────────────────────────────────────────────
import mongoose from "mongoose";

// Individual question attempt within a session
const AttemptSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    selectedOption: { type: Number, min: 0, max: 3, default: null }, // null = timed out
    correct: { type: Boolean, required: true },
    timeSpent: { type: Number, required: true, min: 0 }, // seconds
    xpEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuizSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      enum: ["javascript", "react", "python", "dsa"],
    },
    mode: {
      type: String,
      required: true,
      enum: ["timed", "practice"],
      default: "timed",
    },

    // Attempt log — one entry per answered question
    attempts: [AttemptSchema],

    // Final results (populated when session completes)
    score: { type: Number, default: 0 },         // correct count
    totalQuestions: { type: Number, default: 10 },
    xpEarned: { type: Number, default: 0 },
    finalDifficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    accuracy: { type: Number, default: 0 },       // 0–100
    avgTimePerQuestion: { type: Number, default: 0 }, // seconds

    // Session lifecycle
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for fast user history queries
QuizSessionSchema.index({ user: 1, createdAt: -1 });
QuizSessionSchema.index({ user: 1, topic: 1 });

QuizSessionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("QuizSession", QuizSessionSchema);
