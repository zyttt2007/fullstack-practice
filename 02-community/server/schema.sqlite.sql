-- 灶台问答 HearthAsk —— SQLite 建表脚本（与 MySQL 版结构等价，供零安装演示）
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT NOT NULL UNIQUE,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  avatar     TEXT NOT NULL DEFAULT '',
  bio        TEXT NOT NULL DEFAULT '',
  points     INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  tags          TEXT,
  author_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  views         INTEGER NOT NULL DEFAULT 0,
  answers_count INTEGER NOT NULL DEFAULT 0,
  votes         INTEGER NOT NULL DEFAULT 0,
  is_solved     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_questions_author ON questions (author_id);
CREATE INDEX IF NOT EXISTS idx_questions_solved ON questions (is_solved);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions (created_at);
CREATE INDEX IF NOT EXISTS idx_questions_votes ON questions (votes);

CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  author_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  votes       INTEGER NOT NULL DEFAULT 0,
  is_accepted INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers (question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author ON answers (author_id);

CREATE TABLE IF NOT EXISTS votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id   INTEGER NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vote ON votes (user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes (target_type, target_id);
