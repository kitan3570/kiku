import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getMnemonic } from "../controllers/ai.js";

const router = Router();
router.use(authenticate);
router.post("/mnemonic", getMnemonic);

export default router;
