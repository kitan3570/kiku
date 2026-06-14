import { Request, Response } from "express";
import { eq, and, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { words, progress, reviewLogs } from "../db/schema.js";

// ═══════════════════════════════════════════════════════
// 智能间隔映射 — 基于熟悉度自动计算
// 熟悉度 0→1天, 1→2天, 2→4天, 3→7天, 4→14天, 5→30天
// ═══════════════════════════════════════════════════════
const FAMILIARITY_INTERVAL: Record<number, number> = { 0: 1, 1: 2, 2: 4, 3: 7, 4: 14, 5: 30 };

// 升级需连续正确次数
const STREAK_UPGRADE = 3;

// ═══════════════════════════════════════════════════════
// GET /api/review/today
// ═══════════════════════════════════════════════════════
export async function getTodayReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const records = await db
      .select({
        progressId: progress.id,
        wordId: words.id, word: words.word, kana: words.kana,
        romaji: words.romaji, meaning: words.meaning,
        exampleJa: words.exampleJa, exampleZh: words.exampleZh, tags: words.tags,
        familiarity: progress.familiarity, streakCorrect: progress.streakCorrect,
        stability: progress.stability, difficulty: progress.difficulty,
        repetitions: progress.repetitions, lapses: progress.lapses,
        lastReview: progress.lastReview, nextReview: progress.nextReview,
      })
      .from(progress)
      .innerJoin(words, eq(progress.wordId, words.id))
      .where(and(eq(progress.userId, userId), lte(progress.nextReview, now)))
      .orderBy(progress.nextReview);

    res.json({ count: records.length, words: records });
  } catch (err) {
    console.error("[getTodayReview]", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/review/submit — 智能算法提交
// 接受 { wordId, isCorrect: boolean }
// 自动追踪 streak → 自动升级/降级 familiarity → 自动计算间隔
// ═══════════════════════════════════════════════════════
export async function submitReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { wordId, isCorrect } = req.body;

    if (typeof wordId !== "number" || !Number.isInteger(wordId) || wordId < 1) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "wordId required" }); return;
    }
    if (typeof isCorrect !== "boolean") {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "isCorrect (boolean) required" }); return;
    }

    const now = new Date();

    const [existing] = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.wordId, wordId)))
      .limit(1);

    let familiarity: number;
    let streakCorrect: number;
    let newLapses: number;
    let newReps: number;
    let newStability: number;

    if (existing) {
      newReps = existing.repetitions! + 1;

      if (isCorrect) {
        streakCorrect = (existing.streakCorrect ?? 0) + 1;
        newLapses = existing.lapses!;
        newStability = existing.stability! * 1.2;

        // 连续正确达到阈值 → 升级熟悉度
        if (streakCorrect >= STREAK_UPGRADE && existing.familiarity! < 5) {
          familiarity = existing.familiarity! + 1;
          streakCorrect = 0; // 升级后重置 streak
        } else {
          familiarity = existing.familiarity!;
        }
      } else {
        streakCorrect = 0;
        newLapses = existing.lapses! + 1;
        newStability = Math.max(0.5, existing.stability! * 0.6);
        familiarity = Math.max(0, existing.familiarity! - 1); // 降级
      }
    } else {
      // 新词
      newReps = 1;
      if (isCorrect) {
        streakCorrect = 1;
        familiarity = 0;
        newLapses = 0;
        newStability = 1.0;
      } else {
        streakCorrect = 0;
        familiarity = 0;
        newLapses = 1;
        newStability = 1.0;
      }
    }

    const intervalDays = FAMILIARITY_INTERVAL[familiarity] ?? 1;
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    if (existing) {
      await db.update(progress).set({
        familiarity, streakCorrect,
        stability: newStability,
        difficulty: isCorrect ? Math.min(1, (existing.difficulty ?? 0.5) + 0.02) : Math.max(0.1, (existing.difficulty ?? 0.5) - 0.05),
        repetitions: newReps, lapses: newLapses,
        lastReview: now, nextReview, updatedAt: now,
      }).where(eq(progress.id, existing.id));
    } else {
      await db.insert(progress).values({
        userId, wordId,
        familiarity, streakCorrect,
        stability: newStability, difficulty: isCorrect ? 0.55 : 0.45,
        repetitions: 1, lapses: isCorrect ? 0 : 1,
        lastReview: now, nextReview, updatedAt: now,
      });
    }

    // 记录日志
    await db.insert(reviewLogs).values({ userId, wordId, rating: familiarity, isCorrect: isCorrect ? 1 : 0 });

    res.json({
      message: "Review submitted.",
      wordId, familiarity, streakCorrect, isCorrect,
      nextReview: nextReview.toISOString(), intervalDays,
    });
  } catch (err) {
    console.error("[submitReview]", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
