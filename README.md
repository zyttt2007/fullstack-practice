# 全栈应用开发 · 示例项目练习

三个完整的全栈项目，按文档流程（**设计数据库 → 写 PRD → 后端 → 前端**）完成，并且**已经部署到公网，可以直接点开使用**。

## 在线演示（三个独立的网站，各自一条链接）

三个项目是**三个各自独立的网站**，没有合并的入口页，每个链接点开就是那个项目本身：

| 项目 | 线上地址 | 主题 |
| --- | --- | --- |
| ① 个人博客系统 | <https://fullstack-projects.app.workbuddy.host/blog/?sharecode=G66VMBWKQ5> | 青苔笔记 MossNote（旧书 · 城市漫步 · 手冲咖啡） |
| ② 问答社区 | <https://fullstack-projects.app.workbuddy.host/community/?sharecode=G66VMBWKQ5> | 灶台问答 HearthAsk（新手下厨互助） |
| ③ Mini 在线商城 | <https://fullstack-projects.app.workbuddy.host/shop/?sharecode=G66VMBWKQ5> | 一枚手作 HandmadeOne（手作器物小店） |

- 每个链接进去直接就是该项目的首页，可以真正注册、登录、发文章、点赞、评论、提问、回答、加购物车、下单、支付
- 演示账号密码统一 `123456`，也可以自己注册
- 三个项目数据互不相通：各自的 SQLite 数据文件、各自的用户表

> 链接里的 `?sharecode=...` 是访问口令，进站之后同一浏览器内站内跳转不用再带。

### 文档网页版

仓库根目录这份 README 也做成了网页：**`/`**（也就是站点首页）
（<https://fullstack-projects.app.workbuddy.host/?sharecode=G66VMBWKQ5>）
页面由 `tools/build_docs.py` 从本文件生成，改完 README 重新生成即可。

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + react-router-dom + axios + react-markdown
- 后端：Node.js 22 + Express 4（`config / middleware / controllers / routes`）
- 数据库：**MySQL 8**（驱动 mysql2，教程选型）。本机零安装可切换 **SQLite**（Node 22 内置 `node:sqlite`）
- 认证：JWT（jsonwebtoken）+ bcrypt（bcryptjs）
- 配置：`.env`（端口 / 数据库连接 / JWT 密钥），不硬编码

### 关于数据库的说明

教程要求 MySQL，因此三个项目都按 MySQL 写代码（`server/schema.mysql.sql` + mysql2 连接池）。
`server/src/config/db.js` 做了一个**双驱动**：

- `DB_DRIVER=mysql`（默认）：走 MySQL，就是教程的样子
- `DB_DRIVER=sqlite`：用 Node 内置 SQLite，**业务 SQL、表结构、事务完全一致**，零安装即可跑起来

线上演示用的是 SQLite 驱动（托管环境不提供 MySQL 服务），改成 MySQL 只需要改 `.env` 一行。

## 本地运行

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

## 一键生成并部署合并站点

`build_deploy.py` 会把三个项目合并成**一个单端口服务**（`/blog/`、`/community/`、`/shop/`），
改成只用 SQLite、前端打进 `public/`、首次启动自动灌演示数据，用于线上部署：

```bash
# 1. 三个前端按子路径构建
cd 01-blog/web      && APP_BASE=blog      npm run build
cd 02-community/web && APP_BASE=community npm run build
cd 03-shop/web      && APP_BASE=shop      npm run build

# 2. 合成到 deploy/site（顺带把 README 渲染的文档页放进 /docs/）
python tools/build_docs.py     # README.md -> docs-site/index.html
python build_deploy.py

# 3. 本地跑一遍
cd deploy/site && npm install && PORT=8080 node server.js
# 打开 http://localhost:8080
```

## 演示账号（密码都是 `123456`）

| 项目 | 账号 |
| --- | --- |
| 青苔笔记 | 苔痕、阿岚、苏禾、老周 |
| 灶台问答 | 小满、李师傅、陈阿姨、阿果、老白 |
| 一枚手作 | 阿禾、小瓷、舟舟 |

## 功能一览

- **青苔笔记**：注册登录、文章增删改查、Markdown 写作与实时预览、分类与标签、点赞、评论、浏览量、草稿箱、按月归档、搜索
- **灶台问答**：提问（扣 5 分）、回答（+10）、被采纳（+30）、点赞去重、采纳答案、积分排行榜、热门标签、多种排序、不能回答自己的问题
- **一枚手作**：商品列表与筛选、商品详情、购物车（累加 + 库存校验）、地址管理、下单（事务扣库存、价格快照）、优惠券满减、模拟支付、取消订单恢复库存

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

## 验收脚本（tools/）

- `smoke-site.mjs`：对本地合并站点跑一遍完整业务流（登录 / 发帖 / 点赞 / 提问 / 积分 / 下单扣库存 / 支付）
- `live-smoke.mjs`：同一套流程跑在线上链接上
- `ui-flow-live.mjs`：真实浏览器点击流程（登录 → 发布 → 加购 → 下单 → 提问）
- `check-site.mjs`：页面渲染与移动端检查

## 部署环境的一个坑（已在代码里规避）

线上反向代理会用平台凭据覆盖 `Authorization` 头，导致 JWT 校验必然失败。
因此后端取值顺序改为 **`X-Access-Token` 头 → `token` 查询参数 → `Authorization`**，前端两种方式都带，线上和本地都正常。
