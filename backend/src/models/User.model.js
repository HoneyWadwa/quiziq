// ─── models/User.model.js ─────────────────────────────────────────────────────
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Per-topic statistics sub-schema
const TopicStatSchema = new mongoose.Schema(
  {
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    bestDifficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    lastAttempt: { type: Date },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },

    // Gamification
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    streak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: Date.now },

    // Aggregate performance
    totalQuizzes: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },

    // Per-topic stats map: { javascript: { correct, total, ... }, ... }
    topicStats: {
      type: Map,
      of: TopicStatSchema,
      default: {},
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// ── Pre-save: hash password ───────────────────────────────────────────────────
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: verify password ─────────────────────────────────────────
UserSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: compute level from XP ───────────────────────────────────
UserSchema.methods.syncLevel = function () {
  this.level = Math.max(1, Math.floor(this.xp / 200) + 1);
};

// ── Instance method: update streak ───────────────────────────────────────────
UserSchema.methods.updateStreak = function () {
  const now = new Date();
  const last = this.lastActiveDate ? new Date(this.lastActiveDate) : null;

  if (!last) {
    this.streak = 1;
  } else {
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      // Same day — streak unchanged
    } else if (diffDays === 1) {
      this.streak += 1; // Consecutive day
    } else {
      this.streak = 1; // Streak broken
    }
  }

  this.lastActiveDate = now;
};

// ── Virtual: accuracy percentage ─────────────────────────────────────────────
UserSchema.virtual("accuracy").get(function () {
  if (!this.totalQuestions) return 0;
  return Math.round((this.totalCorrect / this.totalQuestions) * 100);
});

// ── Transform: remove sensitive fields from JSON output ──────────────────────
UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", UserSchema);
