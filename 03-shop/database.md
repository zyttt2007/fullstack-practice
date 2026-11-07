# 一枚手作 HandmadeOne — 数据库设计

> 全栈项目练习 ③：Mini 在线商城
> 主题设定：独立手作器物小店（粗陶、织物、文具、香氛）。
> 数据库：MySQL 8（本机演示可切换内置 SQLite，`DB_DRIVER=sqlite`）

## 一、实体关系

```
users ──1:N──> cart_items
users ──1:N──> addresses
users ──1:N──> orders ──1:N──> order_items ──N:1──> products
users ──1:N──> coupons（平台发放给每个用户的券）
```

## 二、表结构

### 1. 用户表 users
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| username / email | UNIQUE | 用户名 / 邮箱 |
| password | VARCHAR(255) | bcrypt |
| avatar / bio | VARCHAR(255) | 头像 / 简介 |
| created_at | DATETIME | 注册时间 |

### 2. 商品表 products
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| name | VARCHAR(120) | 商品名 |
| description | TEXT | 描述（Markdown） |
| price | DECIMAL(10,2) | 价格 |
| stock | INT | 库存 |
| images | TEXT | 图片 JSON 数组（渐变字符占位） |
| category | VARCHAR(32) | 分类：器物 / 织物 / 文具 / 香氛 |
| sales | INT DEFAULT 0 | 销量（下单时 +） |
| created_at / updated_at | DATETIME | 时间 |

### 3. 购物车表 cart_items
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| user_id | INT FK | 用户 |
| product_id | INT FK | 商品 |
| quantity | INT | 数量 |
| created_at | DATETIME | 时间 |
- 唯一索引 `uniq_cart(user_id, product_id)`：同一商品加入购物车时数量累加，而不是插两行。

### 4. 地址表 addresses
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| user_id | INT FK | 用户 |
| name / phone | VARCHAR | 收货人 / 电话 |
| province / city / district / detail | VARCHAR | 省市区 + 详细地址 |
| is_default | TINYINT(1) DEFAULT 0 | 是否默认（每个用户至多一个） |
| created_at | DATETIME | 时间 |

### 5. 订单表 orders
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| order_no | VARCHAR(32) UNIQUE | 订单号（时间戳 + 随机数） |
| user_id | INT FK | 下单用户 |
| address_id | INT | 收货地址快照引用 |
| address_snapshot | TEXT | 地址快照（JSON，下单后不受地址修改影响） |
| total_price | DECIMAL(10,2) | 商品小计 |
| discount_amount | DECIMAL(10,2) | 优惠金额 |
| pay_amount | DECIMAL(10,2) | 实付 = 小计 − 优惠 |
| coupon_id | INT NULL | 使用的优惠券 |
| status | VARCHAR(16) | 待支付 / 已支付 / 已发货 / 已完成 / 已取消 |
| created_at / updated_at | DATETIME | 时间 |

### 6. 订单商品表 order_items
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| order_id | INT FK | 订单 |
| product_id | INT | 商品 |
| name / image | VARCHAR | 下单时的名称与图（快照） |
| price | DECIMAL(10,2) | **下单时的单价快照**（商品改价不影响历史订单） |
| quantity | INT | 数量 |

### 7. 优惠券表 coupons（扩展）
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| code | VARCHAR(32) | 券码 |
| title | VARCHAR(64) | 名称，如「满 99 减 10」 |
| min_amount | DECIMAL(10,2) | 使用门槛 |
| discount | DECIMAL(10,2) | 减免金额 |
| user_id | INT FK | 所属用户 |
| is_used | TINYINT(1) DEFAULT 0 | 是否已用 |
| created_at | DATETIME | 发放时间 |

## 三、关键约束与事务

- 下单（一个事务内）：校验库存 → 计算金额 → 校验并占用优惠券 → 生成订单号 → 写 orders + order_items（价格快照）→ 扣减库存 → 累加销量 → 删除已下单的购物车项 → 标记券已用
- 取消订单（待支付）：恢复库存、回滚销量、释放优惠券
- 设默认地址 / 删除默认地址后，把第一个地址设为默认
- 数量、价格、库存禁止为负数

## 四、建表语句

- MySQL：`server/schema.mysql.sql`
- SQLite：`server/schema.sqlite.sql`（结构等价，供零安装演示）
