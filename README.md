# 全栈应用开发 · 示例项目练习

三个完整的全栈项目，按文档流程（**设计数据库 → 写 PRD → 后端 → 前端**）完成。

| 项目 | 主题 | 端口 | 目录 |
| --- | --- | --- | --- |
| ① 个人博客系统 | 青苔笔记 MossNote（旧书 · 城市漫步 · 手冲咖啡） | 4001 / 5173 | `01-blog/` |
| ② 问答社区 | 灶台问答 HearthAsk（新手下厨互助） | 4002 / 5174 | `02-community/` |
| ③ Mini 在线商城 | 一枚手作 HandmadeOne（手作器物小店） | 4003 / 5175 | `03-shop/` |

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + react-router-dom + axios + react-markdown
- 后端：Node.js 22 + Express 4（`config / middleware / controllers / routes`）
- 数据库：**MySQL 8**（驱动 mysql2，教程选型）。本机零安装演示可切换 **SQLite**（Node 22 内置 `node:sqlite`）
- 认证：JWT（jsonwebtoken）+ bcrypt（bcryptjs）
- 配置：`.env`（端口 / 数据库连接 / JWT 密钥），不硬编码

### 关于数据库的说明

教程要求 MySQL，因此三个项目都按 MySQL 写代码（`server/schema.mysql.sql` + mysql2 连接池）。
考虑到本机不一定装了 MySQL，`server/src/config/db.js` 做了一个**双驱动**：

- `DB_DRIVER=mysql`（默认）：走 MySQL，就是教程的样子
- `DB_DRIVER=sqlite`：用 Node 内置 SQLite，**业务 SQL、表结构、事务完全一致**，零安装即可跑起来截图

切换只需改 `.env` 里的 `DB_DRIVER`。

## 运行方式

进入任一项目（以 01-blog 为例）：

```bash
# 1. 安装依赖
cd 01-blog/server && npm install
cd ../web && npm install

# 2. 初始化数据库 + 灌入演示数据
cd ../server
npm run reset          # = init:db（建表）+ seed（演示数据）

# 3. 构建前端（后端会自动托管 web/dist，一个端口即可访问）
cd ../web && npm run build

# 4. 启动后端（同时提供 API 和前端页面）
cd ../server && npm run dev
# 打开 http://localhost:4001
```

开发模式（前后端分离、热更新）：

```bash
cd 01-blog/server && npm run dev     # API:   http://localhost:4001
cd 01-blog/web    && npm run dev     # 前端:  http://localhost:5173（已配 /api 代理）
```

用真实 MySQL 运行：

```bash
# server/.env 改成 DB_DRIVER=mysql，并填好 DB_HOST/DB_USER/DB_PASSWORD
npm run reset     # 自动 CREATE DATABASE + 建表 + 灌数据
npm run dev
```

## 演示账号（密码都是 `123456`）

| 项目 | 账号 |
| --- | --- |
| 青苔笔记 | 苔痕、阿岚、苏禾、老周 |
| 灶台问答 | 小满、李师傅、陈阿姨、阿果、老白 |
| 一枚手作 | 阿禾、小瓷、舟舟 |

## 目录结构（单项目）

```
0x-xxx/
├─ database.md          # 数据库设计（文档第一步）
├─ PRD.md               # 需求文档（文档第二步）
├─ server/
│  ├─ schema.mysql.sql  # MySQL 建表脚本（主）
│  ├─ schema.sqlite.sql # SQLite 等价脚本（演示用）
│  ├─ .env / .env.example
│  └─ src/
│     ├─ config/db.js   # 双驱动数据访问层
│     ├─ middleware/    # JWT 认证、统一错误处理
│     ├─ controllers/   # 业务逻辑
│     ├─ routes/        # 路由
│     └─ scripts/       # initDb / seed
└─ web/
   └─ src/              # React 页面、组件、上下文
```

截图见 `shots/`（三个项目各一组）。详细说明见 `提交说明.md`。
