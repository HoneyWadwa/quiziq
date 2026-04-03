// ─── data/constants.js — Shared frontend constants ───────────────────────────

export const TOPICS = [
  { id: "javascript", label: "JavaScript", icon: "⚡", color: "#F7DF1E", desc: "ES6+, closures, async" },
  { id: "react", label: "React", icon: "⚛️", color: "#61DAFB", desc: "Hooks, state, patterns" },
  { id: "python", label: "Python", icon: "🐍", color: "#3776AB", desc: "OOP, generators, stdlib" },
  { id: "dsa", label: "DSA", icon: "🧮", color: "#FF6B6B", desc: "Algorithms, complexity" },
];

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"];
export const TIME_LIMIT = 30; // seconds per question in timed mode

// ── Adaptive Algorithm (mirrors backend logic) ────────────────────────────────
/**
 * Determine the next question difficulty based on recent attempt history.
 *
 * Promote: last 3 all correct + avg time < 12s → move up one level
 * Demote:  last 2 both incorrect              → move down one level
 * Default: stay at current difficulty
 */
export const calculateNextDifficulty = (history) => {
  if (!history || history.length === 0) return "easy";

  const current = history[history.length - 1].difficulty;
  const currentIdx = DIFFICULTY_LEVELS.indexOf(current);
  const last3 = history.slice(-3);
  const last2 = history.slice(-2);

  const allCorrect3 = last3.length === 3 && last3.every((h) => h.correct);
  const avgTime3 = last3.reduce((s, h) => s + h.timeSpent, 0) / last3.length;

  if (allCorrect3 && avgTime3 < 12) {
    return DIFFICULTY_LEVELS[Math.min(currentIdx + 1, 2)];
  }

  if (last2.length === 2 && last2.every((h) => !h.correct)) {
    return DIFFICULTY_LEVELS[Math.max(currentIdx - 1, 0)];
  }

  return current;
};

/**
 * XP formula:
 *   base = 10
 *   speed bonus: answered < 5s → +5, < 10s → +3, < 20s → +1
 *   multiplier: easy ×1, medium ×1.5, hard ×2
 */
export const calculateXP = (correct, timeSpent, difficulty) => {
  if (!correct) return 0;
  const speedBonus = timeSpent < 5 ? 5 : timeSpent < 10 ? 3 : timeSpent < 20 ? 1 : 0;
  const multiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;
  return Math.round((10 + speedBonus) * multiplier);
};

/** XP needed to reach a given level */
export const xpForLevel = (level) => level * 200;

/** Derive level from total XP */
export const levelFromXP = (xp) => Math.max(1, Math.floor(xp / 200) + 1);

/** Level display label */
export const levelLabel = (level) =>
  level <= 2 ? "Beginner" : level <= 5 ? "Intermediate" : level <= 9 ? "Advanced" : "Expert";

/** Level display icon */
export const levelIcon = (level) =>
  level <= 2 ? "🌱" : level <= 5 ? "⚡" : level <= 9 ? "🔥" : "👑";
