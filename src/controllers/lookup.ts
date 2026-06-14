import { Request, Response } from "express";
import { eq, or, ilike, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { words, wordCache } from "../db/schema.js";

// ═══════════════════════════════════════════════════════
// GET /api/words/lookup?q=食べる — Jisho API 代理 (24h 缓存)
// ═══════════════════════════════════════════════════════
export async function lookupWord(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 1) {
      res.status(400).json({ error: "VALIDATION", message: "q parameter required" }); return;
    }

    // 检查缓存 (24h)
    const [cached] = await db.select().from(wordCache).where(eq(wordCache.query, q)).limit(1);
    const cacheAge = cached ? Date.now() - new Date(cached.createdAt!).getTime() : Infinity;
    if (cached && cacheAge < 24 * 60 * 60 * 1000) {
      res.json(JSON.parse(cached.data!));
      return;
    }

    // 调用 Jisho API
    const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(q)}`;
    const resp = await fetch(url);
    const raw: any = await resp.json();

    if (!raw?.data?.length) {
      res.json({ found: false, query: q });
      return;
    }

    const results = raw.data.slice(0, 5).map((entry: any) => ({
      word: entry.japanese?.[0]?.word || entry.japanese?.[0]?.reading || q,
      kana: entry.japanese?.[0]?.reading || "",
      meaning: entry.senses?.[0]?.english_definitions?.slice(0, 3).join("；") || "",
      pos: entry.senses?.[0]?.parts_of_speech?.slice(0, 3).join(",") || "",
      example: "", // Jisho 例句需要额外请求，此处省略
      exampleZh: "",
    }));

    const result = { found: true, query: q, results };

    // 写入缓存
    if (cached) {
      await db.update(wordCache).set({ data: JSON.stringify(result), createdAt: new Date() }).where(eq(wordCache.id, cached.id));
    } else {
      await db.insert(wordCache).values({ query: q, data: JSON.stringify(result) });
    }

    res.json(result);
  } catch (err) {
    console.error("[lookup]", err);
    res.status(500).json({ error: "INTERNAL", message: "Lookup failed" });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/search?q=xxx&mode=fuzzy — 全局模糊搜索
// ═══════════════════════════════════════════════════════
export async function searchWords(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 1) { res.json({ results: [] }); return; }

    const pattern = `%${q}%`;
    const userId = req.user!.userId;

    const rows = await db
      .select({
        id: words.id, word: words.word, kana: words.kana, romaji: words.romaji,
        meaning: words.meaning, tags: words.tags, createdAt: words.createdAt,
      })
      .from(words)
      .where(or(ilike(words.word, pattern), ilike(words.kana, pattern), ilike(words.romaji, pattern), ilike(words.meaning, pattern)))
      .limit(20);

    // 查询每个词的复习统计
    const enriched = await Promise.all(rows.map(async (w) => {
      const stats = await db.execute(sql`
        SELECT count(*)::int as total, coalesce(sum(is_correct),0)::int as correct
        FROM review_logs WHERE word_id = ${w.id} AND user_id = ${userId}
      `);
      const row: any = stats.rows[0];
      return { ...w, reviewTotal: row?.total || 0, reviewCorrect: row?.correct || 0 };
    }));

    res.json({ results: enriched, query: q });
  } catch (err) {
    console.error("[search]", err);
    res.status(500).json({ error: "INTERNAL" });
  }
}
