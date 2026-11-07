-- 一枚手作 HandmadeOne —— MySQL 建表脚本（主）
CREATE DATABASE IF NOT EXISTS handmadeone DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE handmadeone;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(32)  NOT NULL UNIQUE,
  email      VARCHAR(128) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  avatar     VARCHAR(255) NOT NULL DEFAULT '',
  bio        VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)   NOT NULL,
  description TEXT,
  price       DECIMAL(10,2)  NOT NULL,
  stock       INT            NOT NULL DEFAULT 0,
  images      TEXT,
  category    VARCHAR(32)    NOT NULL DEFAULT '器物',
  sales       INT            NOT NULL DEFAULT 0,
  created_at  DATETIME       NOT NULL,
  updated_at  DATETIME       NOT NULL,
  INDEX idx_products_category (category),
  INDEX idx_products_price (price),
  INDEX idx_products_sales (sales)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT      NOT NULL,
  product_id INT      NOT NULL,
  quantity   INT      NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uniq_cart (user_id, product_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS addresses (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT      NOT NULL,
  name       VARCHAR(32) NOT NULL,
  phone      VARCHAR(20) NOT NULL,
  province   VARCHAR(32) NOT NULL,
  city       VARCHAR(32) NOT NULL,
  district   VARCHAR(32) NOT NULL,
  detail     VARCHAR(255) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  INDEX idx_addresses_user (user_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_no         VARCHAR(32) NOT NULL UNIQUE,
  user_id          INT      NOT NULL,
  address_id       INT,
  address_snapshot TEXT,
  total_price      DECIMAL(10,2) NOT NULL,
  discount_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  pay_amount       DECIMAL(10,2) NOT NULL,
  coupon_id        INT,
  status           VARCHAR(16) NOT NULL DEFAULT '待支付',
  created_at       DATETIME NOT NULL,
  updated_at       DATETIME NOT NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  name       VARCHAR(120) NOT NULL,
  image      VARCHAR(255) NOT NULL DEFAULT '',
  price      DECIMAL(10,2) NOT NULL,
  quantity   INT NOT NULL,
  INDEX idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coupons (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(32)  NOT NULL,
  title       VARCHAR(64)  NOT NULL,
  min_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount    DECIMAL(10,2) NOT NULL,
  user_id     INT          NOT NULL,
  is_used     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL,
  INDEX idx_coupons_user (user_id),
  CONSTRAINT fk_coupons_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
