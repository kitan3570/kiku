const { Pool } = require('pg');

const SQL = `
CREATE TABLE IF NOT EXISTS review_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rl_user ON review_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rl_created ON review_logs(created_at);

CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  reminder_hour INTEGER NOT NULL DEFAULT 20,
  daily_goal INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE progress ADD COLUMN IF NOT EXISTS streak_correct INTEGER NOT NULL DEFAULT 0;
`;

(async () => {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_a1QUEy0hrsJG@ep-morning-moon-aol8r2vf-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  });
  try {
    await pool.query(SQL);
    console.log('Migration successful: review_logs, user_settings, streak_correct');
  } catch (e) {
    console.error('Migration failed:', e.message);
  } finally {
    await pool.end();
  }
})();
