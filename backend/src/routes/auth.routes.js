// ─── routes/auth.routes.js ────────────────────────────────────────────────────
import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { registerRules, loginRules, validate } from "../middleware/validate.middleware.js";

const router = Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", protect, getMe);

export default router;
