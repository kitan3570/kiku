# ═══════════════════════════════════════════════════════
# 后端 Dockerfile — Node.js TypeScript 编译 + 运行
# ═══════════════════════════════════════════════════════

# ── Stage 1: 构建 ─────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# 依赖安装（利用 Docker 层缓存）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    cp -R node_modules node_modules_prod && \
    npm ci

COPY tsconfig.json ./
COPY src/ ./src/

# TypeScript 编译
RUN npx tsc

# ── Stage 2: 运行 ─────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# 安全：使用非 root 用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY --from=builder /app/node_modules_prod ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]
