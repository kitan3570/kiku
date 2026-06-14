import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { userSettings } from "../db/schema.js";

// ═══════════════════════════════════════════════════════
// GET /api/settings — 获取用户设置
// ═══════════════════════════════════════════════════════
export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (!row) {
      // 返回默认值
      res.json({ reminderHour: 20, dailyGoal: 20 });
      return;
    }

    res.json({ reminderHour: row.reminderHour, dailyGoal: row.dailyGoal });
  } catch (err) {
    console.error("[getSettings]", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

// ═══════════════════════════════════════════════════════
// PUT /api/settings — 更新用户设置
// ═══════════════════════════════════════════════════════
export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { reminderHour, dailyGoal } = req.body;

    if (reminderHour !== undefined && (typeof reminderHour !== "number" || reminderHour < 0 || reminderHour > 23)) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "reminderHour must be 0-23." });
      return;
    }
    if (dailyGoal !== undefined && (typeof dailyGoal !== "number" || dailyGoal < 0)) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "dailyGoal must be >= 0." });
      return;
    }

    const [existing] = await db.select({ id: userSettings.id }).from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (existing) {
      await db.update(userSettings)
        .set({ ...(reminderHour !== undefined ? { reminderHour } : {}), ...(dailyGoal !== undefined ? { dailyGoal } : {}), updatedAt: new Date() })
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({
        userId,
        reminderHour: reminderHour ?? 20,
        dailyGoal: dailyGoal ?? 20,
        updatedAt: new Date(),
      });
    }

    res.json({ message: "Settings updated.", reminderHour: reminderHour ?? 20, dailyGoal: dailyGoal ?? 20 });
  } catch (err) {
    console.error("[updateSettings]", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
