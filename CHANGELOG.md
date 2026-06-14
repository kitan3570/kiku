# 更新日志

## v2.1.0 (2026-06-14)

### ✨ 新增
- 智能复习算法：自动追踪连续正确次数，渐进式信息遮蔽，无需手动评分
- 日/夜/系统主题切换（ThemeContext + Tailwind dark mode）
- 注册表单（前端直接注册 + 自动登录）
- 密码显隐切换（Eye/EyeOff 图标）
- PWA 支持（manifest.json + 离线条目）
- 移动端响应式适配（sm/md/lg 断点 + 44px 触控区域）
- 词库管理页面（标签筛选 + 自定义导入 + 删除）
- JLPT N5 (35词) + N4 (30词) 预制词单，一键导入
- 统计面板：概览卡片 + 准确率折线图 + 熟悉度饼图 + 复习柱状图
- 设置页面：自定义提醒时间 + 每日复习目标
- Recharts 图表集成
- Tab 导航（复习/词库/统计/设置）
- 后端 stats API + review_logs 表 + user_settings 表

### 🔧 改进
- 练习提示根据熟悉度动态变化（0-1 显示全部 / 5 仅显示释义）
- 底部手动干预按钮（✓ 正确 / ✗ 错误），保留人工控制
- 熟悉度进度条 + 连续正确计数显示
- 前端 VITE_API_URL 环境变量支持跨域部署
- 后端 CORS 支持，render.com 部署适配

### 🗃️ 数据库变更
- 新增 `review_logs` 表（每次复习记录）
- 新增 `user_settings` 表（提醒时间、每日目标）
- `progress` 表新增 `streak_correct` 字段

## v1.0.0 (2026-06-13)

### ✨ 初始版本
- Express + Drizzle ORM + PostgreSQL 后端
- JWT 双 Token 认证（Access 15min + Refresh 7天）
- 3D 翻转闪卡（Framer Motion）
- 拼写练习 + 动画反馈
- 日语 TTS 语音朗读（Web Speech API）
- Service Worker 每日提醒通知
- 基础艾宾浩斯复习算法
- Docker Compose 一键部署配置
- Vercel + Render + Neon 免费部署
