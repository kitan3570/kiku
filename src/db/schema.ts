import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
  real,
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════
// users — 用户账户，支持多端 JWT 登录
// ═══════════════════════════════════════════════════════
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 64 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_users_username").on(table.username),
  ]
);

// ═══════════════════════════════════════════════════════
// words — 日语单词词库（全局共享）
// ═══════════════════════════════════════════════════════
export const words = pgTable(
  "words",
  {
    id: serial("id").primaryKey(),
    // 日文汉字写法（如「食べる」）
    word: varchar("word", { length: 128 }).notNull(),
    // 假名注音（如「たべる」）
    kana: varchar("kana", { length: 128 }).notNull(),
    // 罗马音（如「taberu」）
    romaji: varchar("romaji", { length: 256 }),
    // 中文释义
    meaning: text("meaning").notNull(),
    // 日文例句
    exampleJa: text("example_ja"),
    // 例句中文翻译
    exampleZh: text("example_zh"),
    // 词性标签，逗号分隔（如「動詞,一段,食」）
    tags: varchar("tags", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_words_kana").on(table.kana),
    index("idx_words_word").on(table.word),
  ]
);

// ═══════════════════════════════════════════════════════
// progress — 用户学习进度（FSRS / 艾宾浩斯记忆算法）
// ═══════════════════════════════════════════════════════
export const progress = pgTable(
  "progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),

    // — FSRS 算法核心字段 —
    // 记忆稳定性（天）：值越大，遗忘越慢
    stability: real("stability").notNull().default(1.0),
    // 难度系数 D ∈ [0, 1]：0=极难，1=极易
    difficulty: real("difficulty").notNull().default(0.5),
    // 累计复习次数
    repetitions: integer("repetitions").notNull().default(0),
    // 连续正确次数
    lapses: integer("lapses").notNull().default(0),

    // — 用户友好级别（可映射自 stability / difficulty）—
    // 0=完全不会, 1=眼熟, 2=认识, 3=熟悉, 4=掌握, 5=精通
    familiarity: integer("familiarity").notNull().default(0),

    // — 时间追踪 —
    lastReview: timestamp("last_review", { withTimezone: true }),
    nextReview: timestamp("next_review", { withTimezone: true })
      .notNull()
      .defaultNow(), // 新建后立即可复习
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // 每个用户对每个单词只有一条进度记录
    uniqueIndex("uq_progress_user_word").on(table.userId, table.wordId),
    index("idx_progress_next_review").on(table.nextReview),
    index("idx_progress_user_id").on(table.userId),
  ]
);
