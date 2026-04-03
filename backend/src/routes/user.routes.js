// ─── routes/user.routes.js ────────────────────────────────────────────────────
import { Router } from "express";
import { getProfile, updateProfile, getAnalytics, getLeaderboard } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.get("/analytics", getAnalytics);
router.get("/leaderboard", getLeaderboard);

export default router;
