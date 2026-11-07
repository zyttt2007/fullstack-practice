# 青苔笔记 MossNote — 数据库设计

> 全栈项目练习 ①：个人博客系统
> 主题设定：一个记录「旧书 · 城市漫步 · 手冲咖啡」的私人写作博客。
> 数据库：MySQL 8（本机演示时可用内置 SQLite 驱动，表结构与 SQL 保持一致，见 `server/src/config/db.js`）

## 一、实体关系

```
users ──1:N──> posts ──1:N──> comments
  │               │
  │               └──1:N──> likes
  │                          │
  └──────────1:N─────────────┘
categories ──1:N──> posts（逻辑关联，用 category 字段冗余存分类名，便于筛选）
```

## 二、表结构

### 1. 用户表 users

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| username | VARCHAR(32) UNIQUE | 用户名，3-20 字符 |
| email | VARCHAR(128) UNIQUE | 邮箱，唯一 |
| password | VARCHAR(255) | bcrypt 加密后的密码，不返回给前端 |
| avatar | VARCHAR(255) | 头像 URL（默认用首字母色块生成） |
| bio | VARCHAR(255) | 一句话简介 |
| created_at | DATETIME | 注册时间 |

### 2. 分类表 categories

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| name | VARCHAR(32) UNIQUE | 分类名：旧书 / 城市漫步 / 手冲咖啡 / 随笔 |
| description | VARCHAR(255) | 分类描述 |
| sort_order | INT | 首页分类条的排序 |
| created_at | DATETIME | 创建时间 |

### 3. 文章表 posts

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| title | VARCHAR(120) | 标题 |
| content | TEXT | 正文，Markdown 格式 |
| summary | VARCHAR(255) | 摘要（前端自动截取正文前 120 字） |
| cover | VARCHAR(255) | 封面图 URL |
| category | VARCHAR(32) | 分类名（冗余，便于筛选） |
| tags | TEXT | 标签，JSON 数组字符串，如 `["旧书","东京"]` |
| author_id | INT FK → users.id | 作者 |
| views | INT DEFAULT 0 | 浏览数，查看详情时 +1 |
| likes_count | INT DEFAULT 0 | 点赞数（冗余计数，likes 表为准） |
| comments_count | INT DEFAULT 0 | 评论数 |
| status | VARCHAR(16) DEFAULT 'published' | `published` / `draft`（草稿箱，扩展功能） |
| created_at | DATETIME | 发布时间 |
| updated_at | DATETIME | 最后编辑时间 |

### 4. 评论表 comments（扩展：评论系统）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| post_id | INT FK → posts.id | 所属文章 |
| user_id | INT FK → users.id | 评论者 |
| content | VARCHAR(500) | 评论内容 |
| created_at | DATETIME | 评论时间 |

### 5. 点赞表 likes（扩展：点赞功能）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| post_id | INT FK → posts.id | 被点赞文章 |
| user_id | INT FK → users.id | 点赞用户 |
| created_at | DATETIME | 点赞时间 |

- 唯一索引 `uniq_like(post_id, user_id)`：保证同一用户对同一篇文章只能点赞一次；
- 点赞 / 取消点赞都走事务，同步维护 `posts.likes_count`，避免计数漂移。

## 三、索引设计

| 索引 | 作用 |
| --- | --- |
| `idx_posts_category` (category) | 分类筛选 |
| `idx_posts_author` (author_id) | 个人中心「我的文章」 |
| `idx_posts_created` (created_at) | 首页按时间倒序 + 分页 |
| `idx_posts_status` (status) | 草稿 / 已发布筛选 |
| `idx_comments_post` (post_id) | 文章评论列表 |

## 四、完整性约束

- `posts.author_id`、`comments.user_id`、`likes.user_id` 均为外键，删除用户时级联删除其文章 / 评论 / 点赞；
- 删除文章时级联删除其评论与点赞记录；
- 所有「创建 / 更新计数」类操作（点赞、评论、浏览 +1）都在同一个事务里完成。

## 五、建表语句

完整 DDL 见：

- MySQL：`server/schema.mysql.sql`（主，符合教程技术选型）
- SQLite：`server/schema.sqlite.sql`（结构等价，供本机零安装演示，`DB_DRIVER=sqlite` 时使用）
