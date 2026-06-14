import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getTodayReview, submitReview } from "../controllers/review.js";
import { getQuiz, getNewWords } from "../controllers/quiz.js";

const router = Router();

// 所有复习接口均需认证
router.use(authenticate);

// GET /api/review/today
router.get("/today", getTodayReview);

// POST /api/review/submit
router.post("/submit", submitReview);

// GET /api/review/quiz — 四选一题目
router.get("/quiz", authenticate, getQuiz);

// GET /api/review/new-words — 未学新词
router.get("/new-words", authenticate, getNewWords);

export default router;
