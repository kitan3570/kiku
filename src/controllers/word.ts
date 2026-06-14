import { Request, Response } from "express";
import { eq, like, sql, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { words, progress } from "../db/schema.js";
import { N5_WORDS, N4_WORDS } from "../data/jlpt-words.js";

// ═══════════════════════════════════════════════════════
// POST /api/words/import — 批量导入词单
// ═══════════════════════════════════════════════════════
export async function importWords(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;

    // 接受 { words: [...] } 或直接的数组
    const wordList: unknown[] = Array.isArray(body) ? body : body?.words;

    if (!Array.isArray(wordList) || wordList.length === 0) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: 'Request body must contain a "words" array, e.g. { "words": [...] }.',
      });
      return;
    }

    // 校验每条记录的必填字段
    const missing: number[] = [];
    const rows = wordList.map((item: any, i: number) => {
      if (!item?.word || !item?.kana || !item?.meaning) {
        missing.push(i);
        return null;
      }
      return {
        word: String(item.word).slice(0, 128),
        kana: String(item.kana).slice(0, 128),
        romaji: item.romaji ? String(item.romaji).slice(0, 256) : null,
        meaning: String(item.meaning),
        exampleJa: item.example_ja ? String(item.example_ja) : null,
        exampleZh: item.example_zh ? String(item.example_zh) : null,
        tags: item.tags ? String(item.tags).slice(0, 256) : null,
      };
    });

    if (missing.length > 0) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: `Entries at indices [${missing.join(", ")}] are missing required fields (word, kana, meaning).`,
      });
      return;
    }

    const validRows = rows.filter((r): r is NonNullable<typeof r> => r !== null);

    const result = await db.insert(words).values(validRows).returning({
      id: words.id,
      word: words.word,
    });

    res.status(201).json({
      message: `Successfully imported ${result.length} word(s).`,
      imported: result.length,
      words: result,
    });
  } catch (err) {
    console.error("[importWords]", err);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Word import failed.",
    });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/words — 分页查询词单（支持标签筛选）
// ═══════════════════════════════════════════════════════
export async function listWords(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const tag = (req.query.tag as string) || undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (tag) conditions.push(like(words.tags, `%${tag}%`));

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db.select().from(words).where(where).limit(limit).offset(offset).orderBy(words.id),
      db.select({ count: sql<number>`count(*)::int` }).from(words).where(where),
    ]);

    res.json({
      page, limit, total: countResult[0]?.count ?? 0,
      words: rows.map(w => ({
        id: w.id, word: w.word, kana: w.kana, romaji: w.romaji,
        meaning: w.meaning, exampleJa: w.exampleJa, exampleZh: w.exampleZh, tags: w.tags,
      })),
    });
  } catch (err) {
    console.error("[listWords]", err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to list words." });
  }
}

// ═══════════════════════════════════════════════════════
// DELETE /api/words/:id — 删除单词
// ═══════════════════════════════════════════════════════
export async function deleteWord(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "VALIDATION_ERROR", message: "Invalid ID." }); return; }
    await db.delete(words).where(eq(words.id, id));
    res.json({ message: "Word deleted.", id });
  } catch (err) {
    console.error("[deleteWord]", err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to delete." });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/words/preset/:level — 导入预制 JLPT 词单
// ═══════════════════════════════════════════════════════
export async function importPreset(req: Request, res: Response): Promise<void> {
  try {
    const level = (req.params.level as string)?.toUpperCase();
    const userId = req.user!.userId;

    const presetMap: Record<string, typeof N5_WORDS> = { N5: N5_WORDS, N4: N4_WORDS };
    const presetWords = presetMap[level];
    if (!presetWords) { res.status(400).json({ error: "VALIDATION_ERROR", message: "Use N5 or N4." }); return; }

    const existing = await db.select({ word: words.word, kana: words.kana }).from(words);
    const existingSet = new Set(existing.map(e => `${e.word}|${e.kana}`));
    const newWords = presetWords.filter(w => !existingSet.has(`${w.word}|${w.kana}`));
    if (newWords.length === 0) { res.json({ message: "All already imported.", imported: 0 }); return; }

    const inserted = await db.insert(words).values(newWords).returning({ id: words.id });

    if (inserted.length > 0) {
      await db.insert(progress).values(
        inserted.map(w => ({
          userId, wordId: w.id,
          stability: 1.0, difficulty: 0.5, repetitions: 0, lapses: 0, familiarity: 0,
          nextReview: new Date(), updatedAt: new Date(),
        }))
      );
    }

    res.json({ message: `Imported ${inserted.length} ${level} word(s).`, imported: inserted.length });
  } catch (err) {
    console.error("[importPreset]", err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to import preset." });
  }
}
