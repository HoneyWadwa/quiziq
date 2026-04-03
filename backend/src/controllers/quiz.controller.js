// ─── controllers/quiz.controller.js ──────────────────────────────────────────
import mongoose from "mongoose";
import Question from "../models/Question.model.js";
import QuizSession from "../models/QuizSession.model.js";
import User from "../models/User.model.js";
import { AppError } from "../middleware/error.middleware.js";

// ── Adaptive Algorithm ────────────────────────────────────────────────────────
const DIFFICULTY_LEVELS = ["easy", "medium", "hard"];

/**
 * Determine next difficulty based on recent attempt history.
 *
 * Promote rule:  3 consecutive correct + avg time < 12s → go up one level
 * Demote rule:   2 consecutive incorrect → go down one level
 * Default:       stay at current level
 */
export const calculateNextDifficulty = (history) => {
  if (!history || history.length === 0) return "easy";

  const currentDiff = history[history.length - 1].difficulty;
  const currentIdx = DIFFICULTY_LEVELS.indexOf(currentDiff);

  const last3 = history.slice(-3);
  const last2 = history.slice(-2);

  // Promote
  if (
    last3.length === 3 &&
    last3.every((h) => h.correct) &&
    last3.reduce((sum, h) => sum + h.timeSpent, 0) / 3 < 12
  ) {
    return DIFFICULTY_LEVELS[Math.min(currentIdx + 1, 2)];
  }

  // Demote
  if (last2.length === 2 && last2.every((h) => !h.correct)) {
    return DIFFICULTY_LEVELS[Math.max(currentIdx - 1, 0)];
  }

  return currentDiff;
};

/**
 * XP formula:
 *   base = 10
 *   speed bonus: <5s → +5, <10s → +3, <20s → +1
 *   multiplier: easy ×1, medium ×1.5, hard ×2
 */
export const calculateXP = (correct, timeSpent, difficulty) => {
  if (!correct) return 0;
  const speedBonus = timeSpent < 5 ? 5 : timeSpent < 10 ? 3 : timeSpent < 20 ? 1 : 0;
  const multiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;
  return Math.round((10 + speedBonus) * multiplier);
};

// ── GET /api/quiz/questions?topic=javascript&difficulty=easy&exclude=id1,id2 ──
export const getQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty = "easy", exclude = "" } = req.query;

    if (!topic) throw new AppError("topic query param is required", 400);

    const excludeIds = exclude
      ? exclude.split(",").filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id))
      : [];

    // Pull 5 random questions (more than needed so frontend can pick)
    const questions = await Question.aggregate([
      { $match: { topic, difficulty, ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}) } },
      { $sample: { size: 5 } },
      { $project: { answer: 0, __v: 0 } }, // Never send answer
    ]);

    res.json({ success: true, questions });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/quiz/next-question — adaptive pick for ongoing session ────────────
export const getNextQuestion = async (req, res, next) => {
  try {
    const { topic, history = "[]", usedIds = "" } = req.query;
    if (!topic) throw new AppError("topic is required", 400);

    const parsedHistory = JSON.parse(history);
    const nextDifficulty = calculateNextDifficulty(parsedHistory);

    const excludeIds = usedIds
      ? usedIds.split(",").filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id))
      : [];

    let questions = await Question.aggregate([
      { $match: { topic, difficulty: nextDifficulty, ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}) } },
      { $sample: { size: 1 } },
      { $project: { answer: 0, __v: 0 } },
    ]);

    // Fallback: if no questions at that difficulty, try any difficulty
    if (!questions.length) {
      questions = await Question.aggregate([
        { $match: { topic, ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}) } },
        { $sample: { size: 1 } },
        { $project: { answer: 0, __v: 0 } },
      ]);
    }

    if (!questions.length) throw new AppError("No more questions available", 404);

    res.json({ success: true, question: questions[0], difficulty: nextDifficulty });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/quiz/check-answer ───────────────────────────────────────────────
export const checkAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOption } = req.body;

    const question = await Question.findById(questionId);
    if (!question) throw new AppError("Question not found", 404);

    const correct = Number(selectedOption) === question.answer;

    // Update question usage stats
    await Question.findByIdAndUpdate(questionId, {
      $inc: { timesServed: 1, ...(correct ? { timesCorrect: 1 } : {}) },
    });

    res.json({
      success: true,
      correct,
      correctOption: question.answer,
      explanation: question.explanation,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/quiz/submit — finalize a completed quiz session ─────────────────
export const submitQuiz = async (req, res, next) => {
  try {
    const { topic, mode, attempts } = req.body;
    const userId = req.user._id;

    if (!attempts?.length) throw new AppError("No attempts provided", 400);

    // Calculate session stats
    const score = attempts.filter((a) => a.correct).length;
    const totalQuestions = attempts.length;
    const accuracy = Math.round((score / totalQuestions) * 100);
    const avgTime = Math.round(attempts.reduce((s, a) => s + a.timeSpent, 0) / totalQuestions);
    const finalDifficulty = attempts[attempts.length - 1]?.difficulty || "easy";

    // Build XP-annotated attempts
    const enrichedAttempts = attempts.map((a) => ({
      questionId: a.questionId,
      difficulty: a.difficulty,
      selectedOption: a.selectedOption ?? null,
      correct: a.correct,
      timeSpent: a.timeSpent,
      xpEarned: calculateXP(a.correct, a.timeSpent, a.difficulty),
    }));

    const totalXP = enrichedAttempts.reduce((s, a) => s + a.xpEarned, 0);

    // Persist session
    const session = await QuizSession.create({
      user: userId,
      topic,
      mode,
      attempts: enrichedAttempts,
      score,
      totalQuestions,
      xpEarned: totalXP,
      finalDifficulty,
      accuracy,
      avgTimePerQuestion: avgTime,
      status: "completed",
      completedAt: new Date(),
    });

    // Update user stats atomically
    const user = await User.findById(userId);

    user.xp += totalXP;
    user.totalQuizzes += 1;
    user.totalCorrect += score;
    user.totalQuestions += totalQuestions;
    user.syncLevel();
    user.updateStreak();

    // Merge topic stats
    const existing = user.topicStats.get(topic) || { correct: 0, total: 0 };
    user.topicStats.set(topic, {
      correct: existing.correct + score,
      total: existing.total + totalQuestions,
      bestDifficulty:
        DIFFICULTY_LEVELS.indexOf(finalDifficulty) > DIFFICULTY_LEVELS.indexOf(existing.bestDifficulty || "easy")
          ? finalDifficulty
          : existing.bestDifficulty || "easy",
      lastAttempt: new Date(),
    });

    await user.save();

    res.status(201).json({
      success: true,
      session: {
        id: session._id,
        score,
        totalQuestions,
        accuracy,
        xpEarned: totalXP,
        finalDifficulty,
        avgTimePerQuestion: avgTime,
      },
      user: {
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        totalQuizzes: user.totalQuizzes,
        totalCorrect: user.totalCorrect,
        topicStats: Object.fromEntries(user.topicStats),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/quiz/history — user's past sessions ──────────────────────────────
export const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      QuizSession.find({ user: req.user._id, status: "completed" })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-attempts"), // Don't send full attempts for history list
      QuizSession.countDocuments({ user: req.user._id, status: "completed" }),
    ]);

    res.json({
      success: true,
      sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/quiz/history/:id — single session detail ────────────────────────
export const getSessionDetail = async (req, res, next) => {
  try {
    const session = await QuizSession.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("attempts.questionId", "question options explanation topic difficulty");

    if (!session) throw new AppError("Session not found", 404);

    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
};
