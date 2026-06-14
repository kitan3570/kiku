import { Request, Response } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { words, progress, reviewLogs } from "../db/schema.js";

// ═══════════════════════════════════════════════════════
// GET /api/stats/overview — 总览
// ═══════════════════════════════════════════════════════
export async function overview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const [totalWords, mastered, todayDue, todayDone, streak] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(progress).where(eq(progress.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(progress).where(and(eq(progress.userId, userId), eq(progress.familiarity, 5))),
      db.select({ count: sql<number>`count(*)::int` }).from(progress).where(and(eq(progress.userId, userId), sql`${progress.nextReview} <= ${now}`)),
      db.select({ count: sql<number>`count(*)::int` }).from(reviewLogs).where(and(eq(reviewLogs.userId, userId), sql`${reviewLogs.createdAt}::date = current_date`)),
      db.select({ count: sql<number>`count(*)::int` }).from(reviewLogs).where(eq(reviewLogs.userId, userId)).orderBy(sql`${reviewLogs.createdAt}::date desc`).limit(1),
    ]);

    res.json({
      totalWords: totalWords[0]?.count ?? 0,
      mastered: mastered[0]?.count ?? 0,
      todayDue: todayDue[0]?.count ?? 0,
      todayDone: todayDone[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("[stats:overview]", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/stats/accuracy — 准确率趋势 (近 14 天)
// ═══════════════════════════════════════════════════════
export async function accuracy(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const rows = await db.execute(sql`
      SELECT 
        created_at::date as date,
        count(*) as total,
        sum(is_correct) as correct
      FROM review_logs
      WHERE user_id = ${userId} AND created_at >= current_date - interval '13 days'
      GROUP BY created_at::date
      ORDER BY date
    `);

    res.json({
      data: (rows.rows || []).map((r: any) => ({
        date: r.date,
        total: parseInt(r.total),
        correct: parseInt(r.correct),
        rate: parseInt(r.total) > 0 ? Math.round((parseInt(r.correct) / parseInt(r.total)) * 100) : 0,
      })),
    });
  } catch (err) {
    console.error("[stats:accuracy]", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/stats/levels — 熟悉度分布
// ═══════════════════════════════════════════════════════
export async function levels(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const rows = await db.execute(sql`
      SELECT familiarity, count(*)::int as count FROM progress
      WHERE user_id = ${userId} GROUP BY familiarity ORDER BY familiarity
    `);
    res.json({ data: rows.rows || [] });
  } catch (err) {
    console.error("[stats:levels]", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
