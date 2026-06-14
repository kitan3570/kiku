import { Request, Response } from "express";
import { eq, and, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { progress, reviewLogs } from "../db/schema.js";

// ═══════════════════════════════════════════════════════
// GET /api/stats/overview
// ═══════════════════════════════════════════════════════
export async function overview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const total = await db.select({ count: sql<number>`count(*)::int` }).from(progress).where(eq(progress.userId, userId));
    const mastered = await db.select({ count: sql<number>`count(*)::int` }).from(progress).where(and(eq(progress.userId, userId), eq(progress.familiarity, 5)));
    const due = await db.select({ count: sql<number>`count(*)::int` }).from(progress).where(and(eq(progress.userId, userId), lte(progress.nextReview, now)));
    const todayDone = await db.execute(sql`SELECT count(*)::int as count FROM review_logs WHERE user_id = ${userId} AND created_at::date = current_date`);

    res.json({
      totalWords: total[0]?.count ?? 0,
      mastered: mastered[0]?.count ?? 0,
      todayDue: due[0]?.count ?? 0,
      todayDone: (todayDone.rows[0] as any)?.count ?? 0,
    });
  } catch (err: any) {
    console.error("[stats:overview]", err?.message || err);
    res.status(500).json({ error: "INTERNAL_ERROR", detail: err?.message });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/stats/accuracy
// ═══════════════════════════════════════════════════════
export async function accuracy(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const rows = await db.execute(sql`
      SELECT created_at::date as date, count(*)::int as total, coalesce(sum(is_correct),0)::int as correct
      FROM review_logs WHERE user_id = ${userId}
      AND created_at >= current_date - interval '13 days'
      GROUP BY date ORDER BY date
    `);
    res.json({
      data: (rows.rows || []).map((r: any) => ({
        date: r.date, total: r.total, correct: r.correct,
        rate: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
      })),
    });
  } catch (err: any) {
    console.error("[stats:accuracy]", err?.message || err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/stats/levels
// ═══════════════════════════════════════════════════════
export async function levels(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const rows = await db.execute(sql`
      SELECT familiarity, count(*)::int as count FROM progress
      WHERE user_id = ${userId} GROUP BY familiarity ORDER BY familiarity
    `);
    res.json({ data: rows.rows || [] });
  } catch (err: any) {
    console.error("[stats:levels]", err?.message || err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
