// ─── middleware/validate.middleware.js ────────────────────────────────────────
import { body, validationResult } from "express-validator";

/** Run after validation chains — collects errors and returns 400 if any */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Validation rule sets ──────────────────────────────────────────────────────

export const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

export const quizSubmitRules = [
  body("topic")
    .notEmpty().withMessage("Topic is required")
    .isIn(["javascript", "react", "python", "dsa"]).withMessage("Invalid topic"),

  body("mode")
    .notEmpty().withMessage("Mode is required")
    .isIn(["timed", "practice"]).withMessage("Mode must be timed or practice"),

  body("attempts")
    .isArray({ min: 1 }).withMessage("Attempts must be a non-empty array"),

  body("attempts.*.questionId")
    .notEmpty().withMessage("Each attempt must have a questionId"),

  body("attempts.*.correct")
    .isBoolean().withMessage("correct must be a boolean"),

  body("attempts.*.timeSpent")
    .isInt({ min: 0 }).withMessage("timeSpent must be a non-negative integer"),
];
