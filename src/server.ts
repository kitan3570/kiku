import "dotenv/config";

import express from "express";
import cors from "cors";
import { checkDatabaseConnection } from "./db/index.js";
import authRoutes from "./routes/auth.js";
import wordRoutes, { searchRouter } from "./routes/word.js";
import reviewRoutes from "./routes/review.js";
import statsRoutes from "./routes/stats.js";
import settingsRoutes from "./routes/settings.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// ═══════════════════════════════════════════════════════
// 全局中间件
// ═══════════════════════════════════════════════════════

// CORS — 前后端分离时必须配置允许前端域名
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// 解析 JSON 请求体
app.use(express.json({ limit: "1mb" }));

// 请求日志（开发环境）
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ═══════════════════════════════════════════════════════
// 健康检查
// ═══════════════════════════════════════════════════════
app.get("/api/health", async (_req, res) => {
  const dbOk = await checkDatabaseConnection();

  res.json({
    status: dbOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database: dbOk ? "connected" : "disconnected",
  });
});

// ═══════════════════════════════════════════════════════
// API 路由
// ═══════════════════════════════════════════════════════
app.use("/api/auth", authRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/search", searchRouter);
app.use("/api/review", reviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/settings", settingsRoutes);

// ═══════════════════════════════════════════════════════
// 启动服务器
// ═══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`🚀 Kiku API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
