// ─── controllers/user.controller.js ──────────────────────────────────────────
import User from "../models/User.model.js";
import QuizSession from "../models/QuizSession.model.js";
import { AppError } from "../middleware/error.middleware.js";

// ── GET /api/users/profile ────────────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError("User not found", 404);

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
        accuracy: user.accuracy,
        topicStats: Object.fromEntries(user.topicStats),
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/users/profile ──────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    // Only allow updating name for now (email/password have separate flows)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/analytics ──────────────────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Last 7 sessions for trend line
    const recentSessions = await QuizSession.find({ user: userId, status: "completed" })
      .sort({ completedAt: -1 })
      .limit(7)
      .select("accuracy topic xpEarned completedAt finalDifficulty score totalQuestions");

    // Per-topic breakdown
    const topicBreakdown = await QuizSession.aggregate([
      { $match: { user: userId, status: "completed" } },
      {
        $group: {
          _id: "$topic",
          sessions: { $sum: 1 },
          totalScore: { $sum: "$score" },
          totalQuestions: { $sum: "$totalQuestions" },
          avgAccuracy: { $avg: "$accuracy" },
          avgTime: { $avg: "$avgTimePerQuestion" },
          totalXP: { $sum: "$xpEarned" },
          lastPlayed: { $max: "$completedAt" },
        },
      },
      { $sort: { sessions: -1 } },
    ]);

    // Difficulty distribution across all sessions
    const difficultyDist = await QuizSession.aggregate([
      { $match: { user: userId, status: "completed" } },
      { $unwind: "$attempts" },
      {
        $group: {
          _id: "$attempts.difficulty",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$attempts.correct", 1, 0] } },
        },
      },
    ]);

    // Weak areas: topics where accuracy < 60%
    const weakAreas = topicBreakdown
      .filter((t) => t.avgAccuracy < 60 && t.sessions >= 1)
      .map((t) => ({ topic: t._id, accuracy: Math.round(t.avgAccuracy) }));

    // Weekly XP (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyXP = await QuizSession.aggregate([
      { $match: { user: userId, status: "completed", completedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: "$completedAt" },
          xp: { $sum: "$xpEarned" },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        recentSessions: recentSessions.reverse(), // chronological
        topicBreakdown: topicBreakdown.map((t) => ({
          topic: t._id,
          sessions: t.sessions,
          accuracy: Math.round(t.avgAccuracy),
          avgTime: Math.round(t.avgTime),
          totalXP: t.totalXP,
          lastPlayed: t.lastPlayed,
        })),
        difficultyDistribution: difficultyDist.map((d) => ({
          difficulty: d._id,
          total: d.total,
          correct: d.correct,
          accuracy: Math.round((d.correct / d.total) * 100),
        })),
        weakAreas,
        weeklyXP,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/leaderboard ────────────────────────────────────────────────
export const getLeaderboard = async (req, res, next) => {
  try {
    const top = await User.find({})
      .sort({ xp: -1 })
      .limit(10)
      .select("name xp level streak totalQuizzes");

    const myRank = await User.countDocuments({ xp: { $gt: req.user.xp } });

    res.json({
      success: true,
      leaderboard: top.map((u, i) => ({
        rank: i + 1,
        id: u._id,
        name: u.name,
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        totalQuizzes: u.totalQuizzes,
        isMe: u._id.toString() === req.user._id.toString(),
      })),
      myRank: myRank + 1,
    });
  } catch (err) {
    next(err);
  }
};
