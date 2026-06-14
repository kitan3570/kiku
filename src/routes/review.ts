import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getTodayReview, submitReview } from "../controllers/review.js";

const router = Router();

// 所有复习接口均需认证
router.use(authenticate);

// GET /api/review/today
router.get("/today", getTodayReview);

// POST /api/review/submit
router.post("/submit", submitReview);

export default router;
