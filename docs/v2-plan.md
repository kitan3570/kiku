# Kiku v2.0 — 迭代计划

## Phase 1: 用户系统增强 (1-3)

### 1.1 前端注册页
- 在登录表单下方添加「没有账号？注册」切换按钮
- 注册表单：用户名 + 密码 + 确认密码
- 调用已有 `POST /api/auth/register`
- 注册成功自动登录

### 1.2 密码显隐切换
- 密码输入框右侧添加眼睛图标 (Eye / EyeOff)
- 点击切换 `type="password"` ↔ `type="text"`

### 1.3 日/夜间模式
- 新建 `ThemeContext`：`light` / `dark` / `system`
- localStorage 持久化主题选择
- Tailwind `dark:` 前缀适配所有组件
- 顶部栏添加 Sun/Moon 切换按钮
- 默认跟随系统 `prefers-color-scheme`

---

## Phase 2: 移动端 + 响应式 (4)

### 2.1 响应式布局
- 所有页面适配 `sm:` `md:` `lg:` 断点
- 闪卡在移动端全宽，桌面端居中 max-w-md
- 导航按钮增大触控区域 (min-h-11)
- 输入框移动端字体不小于 16px（防 iOS 缩放）

### 2.2 PWA 基础配置
- manifest.json（图标 + 全屏模式）
- 已部署的 sw.js 增强离线缓存

---

## Phase 3: 词库管理 (5, 6, 11)

### 3.1 单词/词单导入界面
- 新增页面 `/words`
- 表单模式：逐个添加单词
- 批量模式：文本区域粘贴 JSON/CSV
- 日语输入法友好（IME 支持）

### 3.2 词单列表界面
- 显示所有已导入单词，按 tags 分组
- 标签筛选：「動詞」「名詞」「形容詞」「N5」「N1」等
- 每词显示：汉字 + 假名 + 释义 + 熟悉度徽章
- 支持删除单词

### 3.3 JLPT 分级预制词单
- 后端或种子文件预置 N5~N1 约 500+ 词
- 前端词单页面可选择「导入 N5 词单」
- 一键批量创建进度记录
- 已导入的单词标记「已添加」，防止重复

### 3.4 后端补充
- `GET /api/words` — 分页查询用户词单（支持 tag 筛选）
- `DELETE /api/words/:id` — 删除单词
- `POST /api/words/preset/:level` — 导入预制词单
- `GET /api/words/stats` — 词库统计（总数、各级别分布）

---

## Phase 4: 统计面板 (7)

### 4.1 后端统计 API
- `GET /api/stats/overview` — 总览：总词数、已学、今日复习、连续打卡天数
- `GET /api/stats/accuracy` — 准确率趋势（近 7/30 天）
- `GET /api/stats/heatmap` — 学习热力图（类似 GitHub 贡献图）
- `GET /api/stats/levels` — 熟悉度分布（0-5 饼图数据）
- 新建 DB 表 `review_logs`：记录每次复习的 word_id、rating、timestamp

### 4.2 前端统计页面
- 新增页面 `/stats`
- 概览卡片：总单词、已掌握、今日复习、连续天数
- Recharts 图表：准确率折线图、熟悉度饼图、每日复习柱状图
- 学习热力图（自定义 SVG/CSS Grid）

---

## Phase 5: 设置 (8)

### 5.1 后端设置 API
- 新建 DB 表 `user_settings`：user_id, reminder_time, daily_goal, theme
- `GET /api/settings` — 获取设置
- `PUT /api/settings` — 更新设置
- SW 提醒时间改为从设置读取

### 5.2 前端设置页
- 新增页面 `/settings`
- 提醒时间选择器（默认 20:00）
- 每日复习数量滑块（10/20/30/50/100/全部）
- 主题切换也放这里

---

## Phase 6: 智能复习算法 (9)

### 6.1 算法设计 — 「渐进式信息遮蔽」
- **新词阶段 (familiarity 0-1)**：显示汉字 + 假名 + 罗马音 + 释义，输入假名
- **初级 (familiarity 2-3)**：隐藏假名，只显示汉字 + 释义，输入假名
- **中级 (familiarity 4)**：隐藏汉字，只显示假名 + 释义，输入汉字
- **高级 (familiarity 5)**：只显示释义，输入汉字 + 假名
- 升级条件：连续 3 次正确 → 升级；1 次失败 → 降级
- 不再使用主观 0-5 评分，改为算法自动追踪

### 6.2 修改 TypingPractice
- 根据 `familiarity` 动态调整显示的提示信息
- 记录每次尝试的 `review_logs`

### 6.3 修改 Flashcard
- 根据 `familiarity` 选择性隐藏部分信息
- 添加「显示答案」按钮（高熟练度时默认隐藏）

---

## Phase 7: README + 新手引导 (10)

### 7.1 GitHub README.md
- 项目简介 + 技术栈
- 本地开发指南
- 部署指南
- API 文档概要
- 截图展示

### 7.2 站内新手引导
- 首次登录弹出 3-4 步引导弹窗
- Step 1: 选择要学习的词单
- Step 2: 学习闪卡操作
- Step 3: 拼写练习
- Step 4: 查看统计
- 完成后不再显示（localStorage 标记）

---

## Phase 8: 部署同步 (12)

- 每完成一个 Phase → git commit + push
- Vercel 自动部署（push 触发）
- Render 手动触发重新部署
- CHANGELOG.md 更新日志

---

## 建议执行顺序

| 优先级 | Phase | 预估工作量 |
|--------|-------|-----------|
| 🔴 P0 | Phase 1: 注册 + 密码 + 主题 | 小 |
| 🔴 P0 | Phase 2: 移动端适配 | 中 |
| 🟡 P1 | Phase 3: 词库管理 + JLPT 词单 | 大 |
| 🟡 P1 | Phase 6: 智能算法 | 大 |
| 🟢 P2 | Phase 4: 统计面板 | 大 |
| 🟢 P2 | Phase 5: 设置 | 中 |
| 🔵 P3 | Phase 7: README + 引导 | 小 |
| 🔵 P3 | Phase 8: 部署同步 | 持续 |

---

## 需要确认

1. JLPT 词单要 N5~N1 全部 5 个级别吗？（约 8000+ 词）还是先做 N5+N4（约 1500 词）？
2. 统计图表用 Recharts 还是纯 CSS/SVG？
3. 复习算法：确认不用主观评分，改为自动追踪？
