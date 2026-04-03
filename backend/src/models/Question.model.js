// ─── models/Question.model.js ─────────────────────────────────────────────────
import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      enum: ["javascript", "react", "python", "dsa"],
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      index: true,
    },
    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      minlength: [10, "Question must be at least 10 characters"],
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4,
        message: "Questions must have exactly 4 options",
      },
    },
    // Index (0–3) of the correct option
    answer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: [true, "Explanation is required"],
      trim: true,
    },
    // Usage tracking (for analytics)
    timesServed: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for efficient topic+difficulty queries
QuestionSchema.index({ topic: 1, difficulty: 1 });

// Virtual: global accuracy rate for this question
QuestionSchema.virtual("globalAccuracy").get(function () {
  if (!this.timesServed) return null;
  return Math.round((this.timesCorrect / this.timesServed) * 100);
});

QuestionSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    // Never send the answer to the client in quiz fetches
    // (controllers strip it when needed)
    return ret;
  },
});

export default mongoose.model("Question", QuestionSchema);
