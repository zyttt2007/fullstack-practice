-- 青苔笔记 MossNote —— MySQL 建表脚本（主）
CREATE DATABASE IF NOT EXISTS mossnote DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE mossnote;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(32)  NOT NULL UNIQUE,
  email      VARCHAR(128) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  avatar     VARCHAR(255) NOT NULL DEFAULT '',
  bio        VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(32)  NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(120) NOT NULL,
  content        TEXT         NOT NULL,
  summary        VARCHAR(255) NOT NULL DEFAULT '',
  cover          VARCHAR(255) NOT NULL DEFAULT '',
  category       VARCHAR(32)  NOT NULL DEFAULT '随笔',
  tags           TEXT,
  author_id      INT          NOT NULL,
  views          INT          NOT NULL DEFAULT 0,
  likes_count    INT          NOT NULL DEFAULT 0,
  comments_count INT          NOT NULL DEFAULT 0,
  status         VARCHAR(16)  NOT NULL DEFAULT 'published',
  created_at     DATETIME     NOT NULL,
  updated_at     DATETIME     NOT NULL,
  INDEX idx_posts_category (category),
  INDEX idx_posts_author (author_id),
  INDEX idx_posts_created (created_at),
  INDEX idx_posts_status (status),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT      NOT NULL,
  user_id    INT      NOT NULL,
  content    VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_comments_post (post_id),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS likes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT      NOT NULL,
  user_id    INT      NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uniq_like (post_id, user_id),
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
