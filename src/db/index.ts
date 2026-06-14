import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

// ═══════════════════════════════════════════════════════
// PostgreSQL 连接池
// ═══════════════════════════════════════════════════════
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Drizzle ORM 实例（带上 schema 以获得类型推断）
export const db = drizzle(pool, { schema });

// 导出 pool 以便直接执行原始 SQL（如健康检查）
export { pool };

// ═══════════════════════════════════════════════════════
// 数据库连通性测试
// ═══════════════════════════════════════════════════════
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.execute("SELECT 1 AS ok");
    return result.rows.length > 0;
  } catch {
    return false;
  }
}
