# Kiku v3.0 — 迭代计划

## Phase A: 智能导入 + 全局搜索 (2, 7)

### A1. Jisho API 单词自动补全
- 后端 `GET /api/words/lookup?q=食べる` — 代理 Jisho.org API
- 前端输入框：输入日语词 → 自动查发音/释义/例句 → 一键保存

### A2. 全局模糊搜索
- 后端 `GET /api/search?q=taberu&mode=fuzzy` — 搜索 word/kana/romaji/meaning
- 前端顶部搜索框（支持罗马音/中文/日文混合搜索）
- 搜索结果卡片：词义、添加时间、遗忘次数

---

## Phase B: 学习模式升级 (1, 3, 6)

### B1. 学习模式选择器
- 复习页顶部新增：
  - 「复习旧词」— 从 progress 表取 `nextReview <= now`
  - 「学习新词」— 从 words 表取没有 progress 记录的词
  - 数量滑块：10/20/30/50/全部
  - 词单筛选：N5/N4/自定义标签

### B2. 盲听/听写模式
- 新增 ExerciseMode 切换：打字模式 / 听写模式 / 四选一
- 听写模式：隐藏日语，自动播放 TTS → 用户输入假名
- 后端 `GET /api/review/today?mode=dictation` — 返回无日文的数据

### B3. 四选一练习
- 从词库随机抽 3 个干扰项 + 1 个正确项
- 显示日文 → 选中文释义 / 显示中文 → 选日文
- 后端 `GET /api/review/quiz?wordId=1` — 返回干扰项

---

## Phase C: AI 集成 (4)

### C1. AI 助记
- 后端 `POST /api/ai/mnemonic` — 调用 DeepSeek/OpenAI
- 前端 Flashcard 背面加「🧠 AI 助记」按钮
- 请求体：`{ word, kana, meaning }` → AI 返回中文谐音记忆法

### C2. 环境变量
- 新增 `AI_API_KEY` 和 `AI_API_URL`（默认 DeepSeek）
- .env.example 更新

---

## Phase D: 可视化 + 批量管理 (5, 8)

### D1. 学习热力图
- 前端 Heatmap 组件：7×52 格（类似 GitHub 贡献图）
- 后端 `GET /api/stats/heatmap` — 返回每天复习次数

### D2. 批量编辑表格
- 词库页面切换「列表/表格」视图
- 表格模式：多选（Shift 点击）+ 批量操作栏
- 批量打标签、批量删除、批量改复习时间
- 后端 `PUT /api/words/batch` — 批量更新
- 后端 `PUT /api/words/batch-tags` — 批量改标签

---

## Phase E: 游戏化 (9)

### E1. 激励系统
- 答对时：粒子动画 + 成功音效 + 随机鼓励语
- 完成每日目标：弹窗庆祝 + 连续打卡天数显示
- 后端 `GET /api/stats/streak` — 连续打卡天数

### E2. 连胜/成就
- localStorage 记录连胜天数
- 里程碑提示：「🔥 连续 7 天打卡！」「🎯 累计复习 100 次！」

---

## 实施顺序

| 优先级 | Phase | 预估 |
|--------|-------|------|
| 🔴 P0 | A: Jisho 导入 + 全局搜索 | 中 |
| 🔴 P0 | B: 学习模式 + 听写 + 四选一 | 大 |
| 🟡 P1 | D: 热力图 + 批量管理 | 中 |
| 🟡 P1 | E: 游戏化激励 | 中 |
| 🔵 P2 | C: AI 助记 (需 API key) | 小 |

---

## 需确认

1. AI 助记用 DeepSeek 还是 OpenAI？DeepSeek 国内免翻且便宜（你有 key 吗？）
2. Jisho API 是免费的，但有时会慢 — 要加缓存吗？
3. 复习模式中「学习新词」：从词库取没学过的词，还是允许用户手动选词单？
