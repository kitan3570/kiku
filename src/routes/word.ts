import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { importWords } from "../controllers/word.js";

const router = Router();

// POST /api/words/import — 需要认证
router.post("/import", authenticate, importWords);

export default router;
