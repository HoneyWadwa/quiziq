// ─── controllers/auth.controller.js ──────────────────────────────────────────
import User from "../models/User.model.js";
import { signToken } from "../middleware/auth.middleware.js";
import { AppError } from "../middleware/error.middleware.js";

/** Format user + token response (shared by register & login) */
const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      totalQuizzes: user.totalQuizzes,
      totalCorrect: user.totalCorrect,
      totalQuestions: user.totalQuestions,
      topicStats: Object.fromEntries(user.topicStats),
      createdAt: user.createdAt,
    },
  });
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new AppError("An account with this email already exists", 409);

    const user = await User.create({ name, email, password });
    sendAuthResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      throw new AppError("Invalid email or password", 401);
    }

    // Update streak on login
    user.updateStreak();
    await user.save({ validateBeforeSave: false });

    sendAuthResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  const user = req.user; // injected by protect middleware
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      totalQuizzes: user.totalQuizzes,
      totalCorrect: user.totalCorrect,
      totalQuestions: user.totalQuestions,
      topicStats: Object.fromEntries(user.topicStats),
      accuracy: user.accuracy,
      createdAt: user.createdAt,
    },
  });
};
