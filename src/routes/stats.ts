import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { overview, accuracy, levels, heatmap, streak } from "../controllers/stats.js";

const router = Router();
router.use(authenticate);

router.get("/overview", overview);
router.get("/accuracy", accuracy);
router.get("/levels", levels);
router.get("/heatmap", heatmap);
router.get("/streak", streak);

export default router;
