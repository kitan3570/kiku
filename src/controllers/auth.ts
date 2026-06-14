import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
import type { JwtPayload } from "../middleware/auth.js";

// ═══════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════

/** 生成安全的随机 token（用于 refresh token） */
function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

/** 对 raw refresh token 取 SHA-256 哈希 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** 解析客户端 Cookie 字符串 */
function parseCookies(header: string): Record<string, string> {
  const map: Record<string, string> = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      map[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  });
  return map;
}

/** 签发 Access Token */
function signAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET!;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

// ═══════════════════════════════════════════════════════
// POST /api/auth/register — 注册
// ═══════════════════════════════════════════════════════
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "username and password are required.",
      });
      return;
    }

    if (typeof username !== "string" || username.length < 2 || username.length > 64) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "username must be 2–64 characters.",
      });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "password must be at least 6 characters.",
      });
      return;
    }

    // 检查用户名是否已存在
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        error: "CONFLICT",
        message: "Username already taken.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id, username: users.username });

    res.status(201).json({
      message: "Registration successful.",
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Registration failed.",
    });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/auth/login — 登录
// ═══════════════════════════════════════════════════════
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "username and password are required.",
      });
      return;
    }

    // 查找用户
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password.",
      });
      return;
    }

    // 校验密码
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password.",
      });
      return;
    }

    // 签发令牌
    const payload: JwtPayload = { userId: user.id, username: user.username };
    const accessToken = signAccessToken(payload);

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const refreshExpiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "7") * 24 * 60 * 60 * 1000;

    // 持久化 refresh token 哈希
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      deviceInfo: (req.headers["user-agent"] || "unknown").slice(0, 128),
      expiresAt: new Date(Date.now() + refreshExpiresIn),
    });

    // 清理过期 token
    await db
      .delete(refreshTokens)
      .where(lte(refreshTokens.expiresAt, new Date()));

    // Access Token → 响应体；Refresh Token → HttpOnly Secure Cookie
    res.cookie("refresh_token", rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: refreshExpiresIn,
      path: "/api/auth",
    });

    res.json({
      message: "Login successful.",
      accessToken,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Login failed.",
    });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/auth/refresh — 刷新 Access Token
// ═══════════════════════════════════════════════════════
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    // 从 HttpOnly Cookie 中读取 refresh token
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      res.status(401).json({
        error: "NO_REFRESH_TOKEN",
        message: "No refresh token cookie found.",
      });
      return;
    }

    const cookies = parseCookies(cookieHeader);
    const rawRefreshToken = cookies["refresh_token"];
    if (!rawRefreshToken) {
      res.status(401).json({
        error: "NO_REFRESH_TOKEN",
        message: "No refresh token cookie found.",
      });
      return;
    }

    const tokenHash = hashToken(rawRefreshToken);

    // 在数据库中查找
    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
        )
      )
      .limit(1);

    if (!stored || stored.expiresAt < new Date()) {
      // token 无效或过期 → 清理
      if (stored) {
        await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
      }
      res.clearCookie("refresh_token", { path: "/api/auth" });
      res.status(401).json({
        error: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid or expired. Please log in again.",
      });
      return;
    }

    // 获取用户信息
    const [user] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, stored.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({
        error: "USER_NOT_FOUND",
        message: "User associated with this token no longer exists.",
      });
      return;
    }

    // 签发新的 Access Token
    const payload: JwtPayload = { userId: user.id, username: user.username };
    const newAccessToken = signAccessToken(payload);

    // Refresh Token 轮转：删除旧 token，签发新 token
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

    const newRaw = generateRefreshToken();
    const newHash = hashToken(newRaw);
    const refreshExpiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "7") * 24 * 60 * 60 * 1000;

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newHash,
      deviceInfo: stored.deviceInfo,
      expiresAt: new Date(Date.now() + refreshExpiresIn),
    });

    res.cookie("refresh_token", newRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: refreshExpiresIn,
      path: "/api/auth",
    });

    res.json({
      message: "Token refreshed.",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("[refresh]", err);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Token refresh failed.",
    });
  }
}

// ═══════════════════════════════════════════════════════
// POST /api/auth/logout — 登出
// ═══════════════════════════════════════════════════════
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const rawRefreshToken = cookies["refresh_token"];
      if (rawRefreshToken) {
        const tokenHash = hashToken(rawRefreshToken);
        await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
      }
    }

    res.clearCookie("refresh_token", { path: "/api/auth" });
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("[logout]", err);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Logout failed.",
    });
  }
}
