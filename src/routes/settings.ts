import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getSettings, updateSettings } from "../controllers/settings.js";

const router = Router();
router.use(authenticate);

router.get("/", getSettings);
router.put("/", updateSettings);

export default router;
