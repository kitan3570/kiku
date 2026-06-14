import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { importWords, listWords, deleteWord, importPreset } from "../controllers/word.js";

const router = Router();

// POST /api/words/import — 批量导入自定义词单
router.post("/import", authenticate, importWords);

// GET /api/words — 分页词单，支持 ?tag=N5 筛选
router.get("/", authenticate, listWords);

// DELETE /api/words/:id — 删除单词
router.delete("/:id", authenticate, deleteWord);

// POST /api/words/preset/:level — 导入 N5/N4 预制词单
router.post("/preset/:level", authenticate, importPreset);

export default router;
