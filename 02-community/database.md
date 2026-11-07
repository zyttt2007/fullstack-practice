# 灶台问答 HearthAsk — 数据库设计

> 全栈项目练习 ②：问答社区
> 主题设定：面向新手下厨与家庭厨房的互助问答社区。
> 数据库：MySQL 8（本机演示可切换内置 SQLite，`DB_DRIVER=sqlite`）

## 一、实体关系

```
users ──1:N──> questions ──1:N──> answers
  │                                   │
  └──────────────1:N──> votes（可指向 question 或 answer）
```

## 二、表结构

### 1. 用户表 users

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| username | VARCHAR(32) UNIQUE | 用户名 |
| email | VARCHAR(128) UNIQUE | 邮箱 |
| password | VARCHAR(255) | bcrypt 加密 |
| avatar | VARCHAR(255) | 头像（渐变字符） |
| bio | VARCHAR(255) | 简介 |
| points | INT DEFAULT 100 | 积分（新用户送 100） |
| created_at | DATETIME | 注册时间 |

### 2. 问题表 questions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| title | VARCHAR(120) | 标题 |
| content | TEXT | 详细描述，Markdown |
| tags | TEXT | 标签 JSON 数组 |
| author_id | INT FK → users.id | 提问者 |
| views | INT DEFAULT 0 | 浏览数 |
| answers_count | INT DEFAULT 0 | 回答数（冗余计数） |
| votes | INT DEFAULT 0 | 点赞数 |
| is_solved | TINYINT(1) DEFAULT 0 | 是否已解决（采纳答案后置 1） |
| created_at / updated_at | DATETIME | 时间 |

### 3. 回答表 answers

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| question_id | INT FK → questions.id | 所属问题 |
| author_id | INT FK → users.id | 回答者 |
| content | TEXT | 回答内容，Markdown |
| votes | INT DEFAULT 0 | 点赞数 |
| is_accepted | TINYINT(1) DEFAULT 0 | 是否被采纳 |
| created_at / updated_at | DATETIME | 时间 |

### 4. 点赞表 votes

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT AUTO_INCREMENT PK | 主键 |
| user_id | INT FK → users.id | 点赞用户 |
| target_type | VARCHAR(16) | `question` / `answer` |
| target_id | INT | 目标 ID |
| created_at | DATETIME | 时间 |

- 唯一索引 `uniq_vote(user_id, target_type, target_id)`：每个用户对同一目标只能点赞一次；
- 点赞 / 取消点赞走事务：同步 votes 表、目标表 votes 计数、作者积分。

## 三、积分规则

| 行为 | 分值 |
| --- | --- |
| 新用户注册 | +100（注册奖励） |
| 发布问题 | −5 |
| 回答问题 | +10 |
| 回答被采纳 | +30 |
| 问题被点赞（作者） | +5 / 次 |
| 回答被点赞（作者） | +10 / 次 |
| 被取消点赞（作者） | 反向扣回 |

## 四、索引

| 索引 | 作用 |
| --- | --- |
| idx_questions_author (author_id) | 我的提问 |
| idx_questions_solved (is_solved) | 未解决筛选 |
| idx_questions_created (created_at) | 最新排序 |
| idx_questions_votes (votes) | 热门排序 |
| idx_answers_question (question_id) | 回答列表 |

## 五、建表语句

- MySQL：`server/schema.mysql.sql`
- SQLite：`server/schema.sqlite.sql`（结构等价，供零安装演示）
