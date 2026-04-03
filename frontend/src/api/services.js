// ─── api/services.js — All API service calls ─────────────────────────────────
import client from "./client.js";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => client.post("/auth/register", data),
  login: (data) => client.post("/auth/login", data),
  me: () => client.get("/auth/me"),
};

// ── Quiz ──────────────────────────────────────────────────────────────────────
export const quizAPI = {
  /** Get actual question counts per topic */
  getQuestionCounts: () => client.get("/questions/stats/counts"),

  /** Get next adaptive question */
  getNextQuestion: ({ topic, history, usedIds }) =>
    client.get("/quiz/next-question", {
      params: {
        topic,
        history: JSON.stringify(history),
        usedIds: usedIds.join(","),
      },
    }),

  /** Check a single answer — server validates without exposing the key */
  checkAnswer: ({ questionId, selectedOption }) =>
    client.post("/quiz/check-answer", { questionId, selectedOption }),

  /** Submit complete session and update user stats */
  submitQuiz: (data) => client.post("/quiz/submit", data),

  /** Paginated session history */
  getHistory: ({ page = 1, limit = 10 } = {}) =>
    client.get("/quiz/history", { params: { page, limit } }),

  /** Single session detail with question text */
  getSessionDetail: (id) => client.get(`/quiz/history/${id}`),
};

export const aiAPI = {
  generateQuestions: (data) => client.post("/questions/generate-ai", data),
};

// ── User ──────────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => client.get("/users/profile"),
  updateProfile: (data) => client.patch("/users/profile", data),
  getAnalytics: () => client.get("/users/analytics"),
  getLeaderboard: () => client.get("/users/leaderboard"),
};
