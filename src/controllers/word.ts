import { Request, Response } from "express";
import { db } from "../db/index.js";
import { words } from "../db/schema.js";

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
