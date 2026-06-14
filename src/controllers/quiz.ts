import { Request, Response } from "express";
import { eq, not, sql, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { words, progress } from "../db/schema.js";

// ═══════════════════════════════════════════════════════
// GET /api/review/quiz?mode=ja2zh — 四选一题目
// ═══════════════════════════════════════════════════════
export async function getQuiz(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const mode = (req.query.mode as string) || "ja2zh"; // ja2zh | zh2ja

    // 随机取 1 个待复习词作为题目
    const [target] = await db.select({ id: words.id, word: words.word, kana: words.kana, meaning: words.meaning, romaji: words.romaji })
      .from(words)
      .innerJoin(progress, eq(progress.wordId, words.id))
      .where(and(eq(progress.userId, userId), sql`${progress.nextReview} <= now()`))
      .orderBy(sql`random()`)
      .limit(1);

    if (!target) {
      res.json({ found: false }); return;
    }

    // 随机取 3 个干扰项
    const distractors = await db.select({ meaning: words.meaning })
      .from(words)
      .where(not(eq(words.id, target.id)))
      .orderBy(sql`random()`)
      .limit(3);

    const choices = [...distractors.map(d => d.meaning), target.meaning]
      .sort(() => Math.random() - 0.5);

    const question = mode === "ja2zh"
      ? { prompt: target.word, hint: target.kana, type: "ja2zh" as const }
      : { prompt: target.meaning, type: "zh2ja" as const };

    res.json({
      found: true, wordId: target.id, question,
      choices,
      answer: mode === "ja2zh" ? target.meaning : target.word,
      answerExtra: mode === "ja2zh" ? "" : target.kana,
    });
  } catch (err) {
    console.error("[getQuiz]", err);
    res.status(500).json({ error: "INTERNAL" });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/review/new-words — 获取未学新词
// ═══════════════════════════════════════════════════════
export async function getNewWords(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const rows = await db.select({
      id: words.id, word: words.word, kana: words.kana, romaji: words.romaji,
      meaning: words.meaning, exampleJa: words.exampleJa, exampleZh: words.exampleZh, tags: words.tags,
    })
      .from(words)
      .where(not(sql`EXISTS (SELECT 1 FROM progress WHERE progress.word_id = words.id AND progress.user_id = ${userId})`))
      .orderBy(sql`random()`)
      .limit(limit);

    res.json({ count: rows.length, words: rows.map(w => ({ ...w, wordId: w.id, progressId: 0, familiarity: 0, streakCorrect: 0 })) });
  } catch (err) {
    console.error("[getNewWords]", err);
    res.status(500).json({ error: "INTERNAL" });
  }
}
