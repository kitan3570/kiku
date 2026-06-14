import { Request, Response } from "express";
import { eq, and, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { words, progress, reviewLogs } from "../db/schema.js";

// ═══════════════════════════════════════════════════════
// 艾宾浩斯间隔映射
// ═══════════════════════════════════════════════════════
const INTERVAL_MAP: Record<number, number> = {
  0: 1,
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

// ═══════════════════════════════════════════════════════
// GET /api/review/today — 查询今日需复习的单词
// ═══════════════════════════════════════════════════════
export async function getTodayReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const records = await db
      .select({
        progressId: progress.id,
        wordId: words.id,
        word: words.word,
        kana: words.kana,
        romaji: words.romaji,
        meaning: words.meaning,
        exampleJa: words.exampleJa,
        exampleZh: words.exampleZh,
        tags: words.tags,
        familiarity: progress.familiarity,
        stability: progress.stability,
        difficulty: progress.difficulty,
        repetitions: progress.repetitions,
        lapses: progress.lapses,
        lastReview: progress.lastReview,
        nextReview: progress.nextReview,
      })
      .from(progress)
      .innerJoin(words, eq(progress.wordId, words.id))
      .where(
        and(
          eq(progress.userId, userId),
          lte(progress.nextReview, now),
        )
      )
      .orderBy(progress.nextReview);

    res.json({
      count: records.length,
      words: records,
    });
  } catch (err) {
    console.error("[getTodayReview]", err);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to fetch today's review words.",
    });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/review/submit — 提交复习评分
// ═══════════════════════════════════════════════════════
export async function submitReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { wordId, rating } = req.body;

    // ── 参数校验 ──────────────────────────────────────
    if (typeof wordId !== "number" || !Number.isInteger(wordId) || wordId < 1) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "wordId must be a positive integer.",
      });
      return;
    }

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 0 ||
      rating > 5
    ) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "rating must be an integer between 0 and 5.",
      });
      return;
    }

    // ── 计算下次复习时间 ────────────────────────────
    const intervalDays = INTERVAL_MAP[rating] ?? 1;
    const now = new Date();
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // 累计统计
    const isCorrect = rating >= 3;

    // ── 查询已有进度 ─────────────────────────────────
    const [existing] = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          eq(progress.wordId, wordId),
        )
      )
      .limit(1);

    if (existing) {
      // 更新已有进度
      await db
        .update(progress)
        .set({
          familiarity: rating,
          stability: isCorrect
            ? existing.stability! * 1.3
            : Math.max(0.5, existing.stability! * 0.6),
          difficulty: isCorrect
            ? Math.min(1.0, existing.difficulty! + 0.05)
            : Math.max(0.1, existing.difficulty! - 0.1),
          repetitions: existing.repetitions! + 1,
          lapses: isCorrect ? existing.lapses! : existing.lapses! + 1,
          lastReview: now,
          nextReview,
          updatedAt: now,
        })
        .where(eq(progress.id, existing.id));
    } else {
      // 首次复习该词 → 新建进度记录
      await db.insert(progress).values({
        userId,
        wordId,
        familiarity: rating,
        stability: 1.0,
        difficulty: 0.5,
        repetitions: 1,
        lapses: isCorrect ? 0 : 1,
        lastReview: now,
        nextReview,
        updatedAt: now,
      });
    }

    // 记录复习日志（用于统计）
    await db.insert(reviewLogs).values({ userId, wordId, rating, isCorrect: isCorrect ? 1 : 0 });

    res.json({
      message: "Review submitted.",
      wordId,
      rating,
      nextReview: nextReview.toISOString(),
      intervalDays,
    });
  } catch (err) {
    console.error("[submitReview]", err);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to submit review.",
    });
  }
}
