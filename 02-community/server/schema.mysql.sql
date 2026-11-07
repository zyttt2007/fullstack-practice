-- 灶台问答 HearthAsk —— MySQL 建表脚本（主）
CREATE DATABASE IF NOT EXISTS hearthask DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE hearthask;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(32)  NOT NULL UNIQUE,
  email      VARCHAR(128) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  avatar     VARCHAR(255) NOT NULL DEFAULT '',
  bio        VARCHAR(255) NOT NULL DEFAULT '',
  points     INT          NOT NULL DEFAULT 100,
  created_at DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS questions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(120) NOT NULL,
  content       TEXT         NOT NULL,
  tags          TEXT,
  author_id     INT          NOT NULL,
  views         INT          NOT NULL DEFAULT 0,
  answers_count INT          NOT NULL DEFAULT 0,
  votes         INT          NOT NULL DEFAULT 0,
  is_solved     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL,
  updated_at    DATETIME     NOT NULL,
  INDEX idx_questions_author (author_id),
  INDEX idx_questions_solved (is_solved),
  INDEX idx_questions_created (created_at),
  INDEX idx_questions_votes (votes),
  CONSTRAINT fk_questions_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS answers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT      NOT NULL,
  author_id   INT      NOT NULL,
  content     TEXT     NOT NULL,
  votes       INT      NOT NULL DEFAULT 0,
  is_accepted TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL,
  updated_at  DATETIME NOT NULL,
  INDEX idx_answers_question (question_id),
  INDEX idx_answers_author (author_id),
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS votes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT      NOT NULL,
  target_type VARCHAR(16) NOT NULL,
  target_id   INT      NOT NULL,
  created_at  DATETIME NOT NULL,
  UNIQUE KEY uniq_vote (user_id, target_type, target_id),
  INDEX idx_votes_target (target_type, target_id),
  CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
