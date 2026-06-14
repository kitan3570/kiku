import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ═══════════════════════════════════════════════════════
// 扩展 Express Request — 将 JWT 解析结果注入 req.user
// ═══════════════════════════════════════════════════════
export interface JwtPayload {
  userId: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ═══════════════════════════════════════════════════════
// JWT Access Token 校验中间件
// ═══════════════════════════════════════════════════════
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Missing or malformed Authorization header. Expected: Bearer <token>",
      });
      return;
    }

    const token = authHeader.slice(7); // 去掉 "Bearer " 前缀
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      res.status(500).json({
        error: "CONFIG_ERROR",
        message: "JWT_ACCESS_SECRET is not configured",
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Access token has expired. Please refresh your token.",
      });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Access token is invalid.",
      });
      return;
    }
    res.status(500).json({
      error: "AUTH_ERROR",
      message: "Authentication failed.",
    });
  }
}
