// ─── routes/question.routes.js ───────────────────────────────────────────────
import { Router } from "express";
import { listQuestions, getQuestion, createQuestion, bulkCreateQuestions, getQuestionCounts } from "../controllers/question.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { generateAIQuestions } from "../controllers/question.controller.js";

const router = Router();

router.use(protect);

// Get counts per topic (must be before /:id to avoid route conflict)
router.get("/stats/counts", getQuestionCounts);

router.get("/", listQuestions);
router.get("/:id", getQuestion);
router.post("/", createQuestion);
router.post("/bulk", bulkCreateQuestions);
router.post("/generate-ai", generateAIQuestions);

export default router;
