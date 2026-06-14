# 聞く Kiku — 日本語単語復習アプリ

基于艾宾浩斯记忆曲线的日语单词复习 Web 应用。前后端分离架构，支持智能复习算法、语音朗读、拼写练习和统计分析。

> 🚀 在线体验: https://kiku-nine.vercel.app （测试账号: `demo` / `demo123`）

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 📇 **3D 翻转闪卡** | 点击翻转，日文 ↔ 中文释义，Framer Motion 动画 |
| 🔊 **语音朗读** | 浏览器原生 Web Speech API，日语发音（ja-JP） |
| ✍️ **拼写练习** | 输入假名/罗马音/汉字，动画反馈正确/错误 |
| 🧠 **智能复习算法** | 自动追踪连续正确次数，渐进式信息遮蔽，无需手动评分 |
| 📊 **统计面板** | Recharts 图表：准确率趋势、熟悉度分布、每日复习量 |
| 📚 **词库管理** | 自定义导入 + JLPT N5/N4 预制词单（65 词），标签筛选 |
| 🌓 **日/夜间模式** | 支持 Light / Dark / System 三种主题 |
| 📱 **移动端适配** | 响应式设计 + PWA 支持 |
| 🔔 **每日提醒** | Service Worker 通知，自定义提醒时间 |
| 🔐 **JWT 双 Token** | Access Token (15min) + Refresh Token (7天)，自动刷新 |

## 🏗️ 技术栈

| 层 | 技术 |
|----|------|
| **前端** | React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| **后端** | Express 5, TypeScript, Drizzle ORM, PostgreSQL |
| **认证** | JWT (Access + Refresh Token), bcryptjs |
| **部署** | Vercel (前端), Render (后端), Neon (数据库) |
| **工具** | Vite, tsx, Drizzle Kit, Docker Compose |

## 🚀 本地开发

### 前提条件
- Node.js >= 22
- PostgreSQL 16

### 1. 克隆项目
```bash
git clone https://github.com/kitan3570/kiku.git
cd kiku
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env，修改数据库密码和 JWT 密钥
```

### 3. 初始化数据库
```bash
npm install
# 确保 PostgreSQL 运行中
npm run db:push        # 推送 Schema 到数据库
```

### 4. 启动后端
```bash
npm run dev            # http://localhost:3000
```

### 5. 启动前端
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### 6. 导入种子数据
```bash
# 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 导入 JLPT N5 词单（需先获取 token）
curl -X POST http://localhost:3000/api/words/preset/N5 \
  -H "Authorization: Bearer <your_token>"
```

## 📁 项目结构

```
kiku/
├── src/                    # 后端源码
│   ├── server.ts           # Express 入口
│   ├── db/
│   │   ├── schema.ts       # Drizzle ORM 表定义
│   │   └── index.ts        # 数据库连接
│   ├── controllers/        # 业务逻辑
│   ├── routes/             # 路由注册
│   ├── middleware/         # JWT 中间件
│   └── data/               # JLPT 词单数据
├── frontend/               # 前端源码
│   └── src/
│       ├── App.tsx         # 主应用 + Tab 导航
│       ├── components/     # Flashcard, TypingPractice, WordsPage, StatsPage, SettingsPage
│       ├── context/        # AuthContext, ThemeContext
│       ├── api/            # Axios 拦截器
│       └── utils/          # TTS 语音工具
├── docker-compose.yml      # Docker 一键部署
├── backend.Dockerfile      # 后端容器化
├── nginx.conf              # Nginx 配置
└── .env.example            # 环境变量模板
```

## 🔌 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/words` | 词库列表（支持 ?tag=N5 筛选） |
| POST | `/api/words/import` | 批量导入单词 |
| POST | `/api/words/preset/:level` | 导入 JLPT N5/N4 预制词单 |
| DELETE | `/api/words/:id` | 删除单词 |
| GET | `/api/review/today` | 今日待复习单词 |
| POST | `/api/review/submit` | 提交复习结果 |
| GET | `/api/stats/overview` | 学习统计概览 |
| GET | `/api/stats/accuracy` | 准确率趋势 |
| GET | `/api/stats/levels` | 熟悉度分布 |
| GET | `/api/settings` | 获取用户设置 |
| PUT | `/api/settings` | 更新设置 |

## 🎯 复习算法说明

Kiku 使用**渐进式信息遮蔽算法**：

| 熟悉度 | 提示信息 | 输入要求 |
|--------|----------|----------|
| 0-1 新词 | 汉字 + 假名 | 输入假名 |
| 2-3 认识 | 仅汉字 | 输入假名 |
| 4 熟悉 | 仅假名 | 输入汉字 |
| 5 精通 | 仅释义 | 输入假名/汉字 |

- **升级**：连续正确 3 次 → 熟悉度 +1，重置连续计数
- **降级**：答错 1 次 → 熟悉度 -1，重置连续计数
- **间隔**：熟悉度 0→1天, 1→2天, 2→4天, 3→7天, 4→14天, 5→30天

## 🐳 Docker 部署

```bash
# 构建前端
cd frontend && npm run build && cd ..

# 配置环境变量
cp .env.example .env  # 编辑密钥

# 一键启动
docker compose up -d --build
```

## 📝 License

ISC
