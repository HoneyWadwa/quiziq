// ─── app.js — Express Application Setup ──────────────────────────────────────
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import questionRoutes from "./routes/question.routes.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
// ── TEMP DEBUG: test Groq key directly ───────────────────────────────────────
app.get("/api/test-groq", async (req, res) => {
  const key = process.env.GROQ_API_KEY;

  if (!key) return res.json({ error: "GROQ_API_KEY is missing from .env" });
  if (!key.startsWith("gsk_")) return res.json({ error: `Key looks wrong — starts with "${key.slice(0,6)}" instead of "gsk_"` });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 20,
        messages: [{ role: "user", content: "Say hello" }],
      }),
    });

    const text = await response.text();
    res.json({ status: response.status, body: text });
  } catch (err) {
    res.json({ fetchError: err.message });
  }
});
// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "https://quiziq-hg2tsw9fm-honeywadwas-projects.vercel.app"
    ],
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging (dev only) ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests — slow down!" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// ── Auth rate limiter (stricter) ──────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts — try again later." },
});
app.use("/api/auth", authLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "QuizIQ API is healthy 🧠", timestamp: new Date() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/questions", questionRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
