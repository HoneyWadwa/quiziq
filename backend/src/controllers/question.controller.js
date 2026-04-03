// ─── controllers/question.controller.js ──────────────────────────────────────
import Question from "../models/Question.model.js";
import { AppError } from "../middleware/error.middleware.js";
import fetch from "node-fetch";



// ── GET /api/questions?topic=&difficulty= ─────────────────────────────────────
export const listQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter).skip(skip).limit(Number(limit)).sort({ topic: 1, difficulty: 1 }),
      Question.countDocuments(filter),
    ]);

    res.json({ success: true, questions, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/questions/:id ────────────────────────────────────────────────────
export const getQuestion = async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) throw new AppError("Question not found", 404);
    res.json({ success: true, question: q });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/questions — seed / admin create ─────────────────────────────────
export const createQuestion = async (req, res, next) => {
  try {
    const q = await Question.create(req.body);
    res.status(201).json({ success: true, question: q });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/questions/bulk ──────────────────────────────────────────────────
export const bulkCreateQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || !questions.length) {
      throw new AppError("questions array is required", 400);
    }
    const inserted = await Question.insertMany(questions, { ordered: false });
    res.status(201).json({ success: true, inserted: inserted.length });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/questions/stats/counts — Get question counts per topic ──────────
export const getQuestionCounts = async (req, res, next) => {
  try {
    // Get count of questions for each topic
    const counts = await Question.aggregate([
      {
        $group: {
          _id: "$topic",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Convert to object: { javascript: 15, react: 15, ... }
    const result = {};
    counts.forEach((item) => {
      result[item._id] = item.count;
    });

    res.json({ success: true, counts: result });
  } catch (err) {
    next(err);
  }
};

export const generateAIQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty = "medium", count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not set in .env" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content:
              "You are a quiz question generator. You always respond with ONLY a valid raw JSON array — no markdown, no explanation, no extra text whatsoever.",
          },
          {
            role: "user",
            content: `Generate exactly ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty.

Return ONLY a raw JSON array like this:
[
  {
    "question": "What does X mean?",
    "options": ["Answer A", "Answer B", "Answer C", "Answer D"],
    "correctAnswer": 0,
    "explanation": "Because X means Answer A.",
    "difficulty": "${difficulty}",
    "topic": "${topic}"
  }
]

Rules:
- "correctAnswer" must be a number: 0, 1, 2, or 3
- "options" must have exactly 4 items
- No markdown, no backticks, no extra text — ONLY the JSON array`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      return res.status(502).json({ error: `Groq API error ${response.status}: ${errText}` });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || "";
    console.log("Groq raw output:", rawText.slice(0, 400));

    // Extract JSON array (handles any stray text)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "AI returned invalid format. Please try again." });
    }

    let questions;
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response. Please try again." });
    }

    // Validate
    const valid = questions.filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3
    );

    if (!valid.length) {
      return res.status(500).json({ error: "AI generated malformed questions. Please try again." });
    }

    return res.json({ success: true, questions: valid });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ error: "Failed to generate questions: " + err.message });
  }
};