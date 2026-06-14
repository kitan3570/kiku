-- Kiku 日语单词种子数据 (UTF-8)
DELETE FROM progress WHERE word_id IN (1,2,3);
DELETE FROM words WHERE id IN (1,2,3);

INSERT INTO words (id, word, kana, romaji, meaning, example_ja, example_zh, tags, created_at)
VALUES
  (1, '食べる', 'たべる', 'taberu', '吃', '毎朝パンを食べます。', '每天早上吃面包。', '動詞,一段', NOW()),
  (2, '勉強', 'べんきょう', 'benkyou', '学习', '日本語を勉強しています。', '正在学习日语。', '名詞,サ変', NOW()),
  (3, '綺麗', 'きれい', 'kirei', '漂亮、干净', '今日は綺麗な空ですね。', '今天的天空真漂亮呢。', '形容動詞', NOW());

INSERT INTO progress (user_id, word_id, stability, difficulty, repetitions, lapses, familiarity, next_review, created_at, updated_at)
VALUES
  (1, 1, 1.0, 0.5, 0, 0, 0, NOW(), NOW(), NOW()),
  (1, 2, 1.0, 0.5, 0, 0, 0, NOW(), NOW(), NOW()),
  (1, 3, 1.0, 0.5, 0, 0, 0, NOW(), NOW(), NOW());
