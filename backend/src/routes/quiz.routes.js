// ─── routes/quiz.routes.js ────────────────────────────────────────────────────
import { Router } from "express";
import {
  getQuestions,
  getNextQuestion,
  checkAnswer,
  submitQuiz,
  getHistory,
  getSessionDetail,
} from "../controllers/quiz.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { quizSubmitRules, validate } from "../middleware/validate.middleware.js";

const router = Router();

// All quiz routes require auth
router.use(protect);

router.get("/questions", getQuestions);
router.get("/next-question", getNextQuestion);
router.post("/check-answer", checkAnswer);
router.post("/submit", quizSubmitRules, validate, submitQuiz);
router.get("/history", getHistory);
router.get("/history/:id", getSessionDetail);

export default router;
