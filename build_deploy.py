# -*- coding: utf-8 -*-
"""
把三个项目合成「一个可访问的站点」：deploy/site

为什么这样组织：
  部署沙箱只提供一个 HTTP 端口，且一个工作区只有一个应用位（多个目录会互相覆盖）。
  所以把三个项目做成一个 Express 站点的三个子路径：
      /            项目导航
      /blog/       青苔笔记（前端 + /blog/api）
      /community/  灶台问答（前端 + /community/api）
      /shop/       一枚手作（前端 + /shop/api）

  每个项目仍然是独立的 Express 子应用：自己的 SQLite 数据文件、自己的路由、
  自己的 controllers / middleware —— 业务代码从主工程原样拷贝，一行都没改。
"""
import json
import os
import re
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, 'deploy', 'site')

APPS = [
    {'src': '01-blog', 'slug': 'blog', 'pkg': 'mossnote', 'db': 'mossnote-live', 'label': '青苔笔记'},
    {'src': '02-community', 'slug': 'community', 'pkg': 'hearthask', 'db': 'hearthask-live', 'label': '灶台问答'},
    {'src': '03-shop', 'slug': 'shop', 'pkg': 'handmadeone', 'db': 'handmadeone-live', 'label': '一枚手作'},
]

DB_TEMPLATE = """/**
 * 发布版数据访问层：只用 SQLite（node:sqlite，Node 内置，无额外依赖）
 * 数据文件放在系统临时目录；同一容器内重启后若文件还在，数据继续可用。
 * 对外接口与开发版一致：query / queryOne / exec / withTransaction / initSchema / now
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

export const DRIVER = 'sqlite';

export function now(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

let db = null;

function getDb() {
  if (db) return db;
  // DATA_DIR 只作为根目录，仍按项目分子目录，避免三个应用共用同一个数据文件
  const dir = path.join(process.env.DATA_DIR || os.tmpdir(), '__DB_FOLDER__');
  fs.mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(path.join(dir, 'data.sqlite'));
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

function normalizeParam(v) {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === undefined) return null;
  return v;
}

async function runQuery(sql, params = [], handle = null) {
  const args = params.map(normalizeParam);
  const conn = handle?.db || getDb();
  return conn.prepare(sql).all(...args);
}

async function runExec(sql, params = [], handle = null) {
  const args = params.map(normalizeParam);
  const conn = handle?.db || getDb();
  const res = conn.prepare(sql).run(...args);
  return { insertId: Number(res.lastInsertRowid), affectedRows: Number(res.changes) };
}

export const query = (sql, params, handle) => runQuery(sql, params, handle);

export async function queryOne(sql, params, handle) {
  const rows = await runQuery(sql, params, handle);
  return rows[0];
}

export const exec = (sql, params, handle) => runExec(sql, params, handle);

export async function withTransaction(fn) {
  const conn = getDb();
  const handle = { db: conn };
  conn.exec('BEGIN');
  try {
    const result = await fn({
      query: (sql, params) => runQuery(sql, params, handle),
      exec: (sql, params) => runExec(sql, params, handle),
    });
    conn.exec('COMMIT');
    return result;
  } catch (err) {
    conn.exec('ROLLBACK');
    throw err;
  }
}

export async function initSchema() {
  const sql = fs.readFileSync(path.join(ROOT, 'schema.sqlite.sql'), 'utf8');
  getDb().exec(sql);
}

/** 首次启动建表并写入演示数据；已有数据则跳过，避免重启重复插入 */
export async function ensureSeeded(seedFn, label) {
  await initSchema();
  const rows = await query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'"
  );
  if (!rows.length) return false;
  const cnt = await query('SELECT COUNT(*) AS c FROM users');
  if (Number(cnt[0]?.c || 0) > 0) return false;
  console.log(`[boot] 首次启动，写入 ${label} 演示数据…`);
  await seedFn();
  return true;
}
"""

FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#2b2822"/>
  <rect x="8" y="9" width="16" height="2.6" rx="1.3" fill="#7d9a6f"/>
  <rect x="8" y="14.7" width="16" height="2.6" rx="1.3" fill="#c9793f"/>
  <rect x="8" y="20.4" width="10" height="2.6" rx="1.3" fill="#c9b79a"/>
</svg>
"""

FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#2b2822"/>
  <rect x="8" y="9" width="16" height="2.6" rx="1.3" fill="#7d9a6f"/>
  <rect x="8" y="14.7" width="16" height="2.6" rx="1.3" fill="#c9793f"/>
  <rect x="8" y="20.4" width="10" height="2.6" rx="1.3" fill="#c9b79a"/>
</svg>
"""

ROOT_SERVER = """import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

__IMPORTS__

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.disable('x-powered-by');

// 首页：README 渲染成的文档页（三个项目各自独立，没有合并的入口页）
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'docs', 'index.html')));
app.get('/favicon.svg', (_req, res) => res.sendFile(path.join(__dirname, 'favicon.svg')));

// 文档页：README 渲染成的静态页面（由 tools/build_docs.py 生成）
app.use('/docs', express.static(path.join(__dirname, 'docs'), { extensions: ['html'] }));

__MOUNTS__

app.get('/health', (_req, res) => res.json({ ok: true, site: 'fullstack-practice' }));

__BOOT__

const port = Number(process.env.PORT || 8080);
app.listen(port, '0.0.0.0', () => {
  console.log(`[site] listening on 0.0.0.0:${port}`);
  for (const p of ['/blog/', '/community/', '/shop/']) console.log(`[site] ${p}`);
});
"""


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)


def build_app(cfg):
    src = os.path.join(BASE, cfg['src'])
    dst = os.path.join(OUT, 'apps', cfg['slug'])

    # 后端源码（不含 node_modules / 环境文件）
    shutil.copytree(
        os.path.join(src, 'server', 'src'),
        os.path.join(dst, 'server', 'src'),
        ignore=shutil.ignore_patterns('node_modules', '.env*'),
    )
    shutil.copy2(
        os.path.join(src, 'server', 'schema.sqlite.sql'),
        os.path.join(dst, 'server', 'schema.sqlite.sql'),
    )

    # 前端产物放到 public（不能叫 dist/build —— 部署时会当作构建产物被排除）
    dist = os.path.join(src, 'web', 'dist')
    if not os.path.isdir(dist):
        raise RuntimeError(f'{cfg["src"]} 缺少 web/dist，请先 APP_BASE={cfg["slug"]} npm run build')
    shutil.copytree(dist, os.path.join(dst, 'public'))
    # 补一个站点图标，避免浏览器请求 favicon.ico 报 404
    idx_html = os.path.join(dst, 'public', 'index.html')
    html = read(idx_html)
    if 'rel="icon"' not in html:
        html = html.replace('</head>', '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />\n</head>')
        write(idx_html, html)

    # 数据库层
    write(os.path.join(dst, 'server', 'src', 'config', 'db.js'),
          DB_TEMPLATE.replace('__DB_FOLDER__', cfg['db']))

    # 去掉 dotenv 加载（发布版没有 .env，也不该依赖它）
    for root, _, files in os.walk(os.path.join(dst, 'server', 'src')):
        for name in files:
            if not name.endswith('.js'):
                continue
            fp = os.path.join(root, name)
            code = read(fp)
            if 'dotenv/config' in code:
                write(fp, re.sub(r"^import 'dotenv/config';\n", '', code, flags=re.M))

    # seed：把脚本式的 main().catch() 改成可被调用
    seed_path = os.path.join(dst, 'server', 'src', 'scripts', 'seed.js')
    seed = read(seed_path)
    seed = re.sub(r"\nmain\(\)\.catch\(\(err\) => \{[\s\S]*?\}\);\s*$", "\n\nexport default main;\n", seed)
    if 'export default main' not in seed:
        raise RuntimeError(f'{cfg["src"]} 的 seed.js 未能改写')
    write(seed_path, seed)

    # 入口 index.js → app.js：去掉 listen，导出 express app，静态目录指向 public
    idx = read(os.path.join(dst, 'server', 'src', 'index.js'))
    idx = idx.replace("path.resolve(__dirname, '../../web/dist')", "path.resolve(__dirname, '../../public')")
    idx = idx.replace("app.get('*', (_req, res)", "app.get(/^(?!\\/api).*/, (_req, res)")
    idx, n = re.subn(r"\nconst port = Number\(process\.env\.PORT[\s\S]*$", "\n\nexport default app;\n", idx)
    if n != 1:
        raise RuntimeError(f'{cfg["src"]} 的 index.js 结尾未能改写')
    if 'export default app' not in idx:
        raise RuntimeError(f'{cfg["src"]} 未导出 app')
    write(os.path.join(dst, 'server', 'src', 'app.js'), idx)
    os.remove(os.path.join(dst, 'server', 'src', 'index.js'))

    # 根依赖由 site 统一提供，删掉子项目的 package.json 以免被当成另一个项目
    return dst


def build_landing():
    cards = [
        ('01', '青苔笔记', 'blog', '#3f5d45', '一个安静的写作空间：旧书、城市漫步与手冲咖啡。',
         ['文章发布与草稿', '评论 / 点赞', '按月归档', 'Markdown 实时预览'], '苔痕 / 123456'),
        ('02', '灶台问答', 'community', '#b4622d', '新手下厨互助社区：提问、回答、采纳，积分说话。',
         ['提问扣积分', '采纳最佳答案', '点赞去重', '积分排行榜'], '小满 / 123456'),
        ('03', '一枚手作', 'shop', '#8a6a4f', '手作器物小店：粗陶、亚麻与黄铜，能真实下单。',
         ['购物车与库存', '满减优惠券', '下单事务扣库存', '订单状态流转'], '阿禾 / 123456'),
    ]
    card_html = []
    for no, name, slug, color, desc, feats, account in cards:
        chips = ''.join(f'<span class="chip">{f}</span>' for f in feats)
        card_html.append(f"""
      <a class="card" href="/{slug}/" style="--accent:{color}">
        <div class="no">{no}</div>
        <h2>{name}</h2>
        <p class="desc">{desc}</p>
        <div class="chips">{chips}</div>
        <div class="foot">
          <span class="account">演示账号 {account}</span>
          <span class="go">进入 →</span>
        </div>
      </a>""")

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>全栈应用开发 · 三个可运行的项目</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<style>
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; background: #f4f0e8; color: #2b2822;
    font-family: "Noto Serif SC", "Songti SC", "Microsoft YaHei", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }}
  .wrap {{ max-width: 1060px; margin: 0 auto; padding: 72px 24px 96px; }}
  .eyebrow {{
    font-size: 12px; letter-spacing: .28em; text-transform: uppercase;
    color: #8a8377; margin-bottom: 20px;
  }}
  h1 {{ font-size: clamp(30px, 4.4vw, 50px); line-height: 1.22; margin: 0 0 18px; font-weight: 600; letter-spacing: .01em; }}
  .lede {{ max-width: 620px; color: #5c574d; line-height: 1.85; font-size: 15.5px; margin: 0 0 56px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(268px, 1fr)); gap: 18px; }}
  .card {{
    position: relative; display: flex; flex-direction: column;
    background: #fffdf9; border: 1px solid #e3dccf; border-radius: 14px;
    padding: 26px 24px 20px; text-decoration: none; color: inherit;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }}
  .card::before {{
    content: ''; position: absolute; inset: 0 0 auto; height: 3px;
    background: var(--accent); border-radius: 14px 14px 0 0;
  }}
  .card:hover {{ transform: translateY(-3px); box-shadow: 0 14px 34px rgba(60,50,30,.11); border-color: #d6cdbb; }}
  .no {{ font-size: 12px; letter-spacing: .2em; color: var(--accent); font-weight: 600; }}
  .card h2 {{ font-size: 22px; margin: 10px 0 8px; font-weight: 600; }}
  .desc {{ color: #6a6459; font-size: 14px; line-height: 1.75; margin: 0 0 16px; }}
  .chips {{ display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }}
  .chip {{
    font-size: 11.5px; color: #6f6a5f; background: #f3eee4;
    border: 1px solid #e6dfd1; border-radius: 999px; padding: 3px 9px;
  }}
  .foot {{
    margin-top: auto; display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid #eee7da; padding-top: 14px;
  }}
  .account {{ font-size: 12px; color: #948d80; }}
  .go {{ font-size: 13.5px; color: var(--accent); font-weight: 600; }}
  .note {{
    margin-top: 48px; padding-top: 22px; border-top: 1px solid #e3dccf;
    font-size: 12.5px; color: #8a8377; line-height: 1.9;
  }}
  .note b {{ color: #5c574d; font-weight: 600; }}
  .doclink {{
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    margin-top: 22px; padding: 16px 20px; text-decoration: none; color: inherit;
    background: #fffdf9; border: 1px dashed #d8cfbd; border-radius: 12px;
    transition: border-color .18s ease, background .18s ease;
  }}
  .doclink:hover {{ border-color: #b9ad95; background: #fffefb; }}
  .doclink b {{ font-size: 14px; font-weight: 600; }}
  .doclink .sub {{ font-size: 12.5px; color: #8a8377; }}
  .doclink .go2 {{ margin-left: auto; font-size: 13px; font-weight: 600; color: #3f5d45; }}
  @media (max-width: 560px) {{ .wrap {{ padding: 46px 18px 64px; }} }}
</style>
</head>
<body>
  <div class="wrap">
    <div class="eyebrow">Full-Stack Practice</div>
    <h1>三个能真正点开使用的<br />全栈项目</h1>
    <p class="lede">
      按「设计数据库 → 写 PRD → 后端 → 前端」的流程完成，三个项目各自独立运行：
      一键注册登录、发文章、提问回答、加购物车下单，数据真的写进数据库。
    </p>
    <div class="grid">{''.join(card_html)}
    </div>

    <a class="doclink" href="/docs/">
      <b>项目文档</b>
      <span class="sub">技术栈 · 本地运行 · 目录结构 · 部署说明</span>
      <span class="go2">阅读 →</span>
    </a>
    <div class="note">
      <b>技术栈</b>：React 18 + TypeScript + Vite + Tailwind ｜ Node.js + Express ｜ MySQL / SQLite ｜ JWT + bcrypt<br />
      <b>账号</b>：每个项目的演示账号密码都是 <b>123456</b>，也可以直接注册新账号<br />
      <b>说明</b>：三个项目共用一台服务器、各自独立数据库；线上环境用 SQLite 免装数据库，源码里的 MySQL 版本表结构与 SQL 完全一致
    </div>
  </div>
</body>
</html>
"""


def main():
    # 只清掉生成的内容，保留 node_modules（Windows 上删它会因为文件占用失败）
    if os.path.isdir(OUT):
        shutil.rmtree(os.path.join(OUT, 'apps'), ignore_errors=True)
        shutil.rmtree(os.path.join(OUT, 'docs'), ignore_errors=True)
        for name in ('server.js', 'landing.html', 'favicon.svg', 'package.json', '.gitignore'):
            fp = os.path.join(OUT, name)
            if os.path.exists(fp):
                os.remove(fp)
    os.makedirs(OUT, exist_ok=True)

    print('合成站点：')
    imports, mounts, boots = [], [], []
    for cfg in APPS:
        build_app(cfg)
        s, pkg = cfg['slug'], cfg['pkg']
        imports.append(
            f"import {pkg}App from './apps/{s}/server/src/app.js';\n"
            f"import {{ ensureSeeded as seed_{s} }} from './apps/{s}/server/src/config/db.js';\n"
            f"import {pkg}Seed from './apps/{s}/server/src/scripts/seed.js';"
        )
        mounts.append(f"app.use('/{s}', {cfg['pkg']}App);")
        boots.append(
            f"await seed_{s}({cfg['pkg']}Seed, '{cfg['label']}').catch((err) =>\n"
            f"  console.error('[boot] {cfg['label']} 初始化失败：', err)\n"
            f");"
        )
        print(f'  {s:<10} ok')

    write(os.path.join(OUT, 'server.js'),
          ROOT_SERVER.replace('__IMPORTS__', '\n'.join(imports))
                    .replace('__MOUNTS__', '\n'.join(mounts))
                    .replace('__BOOT__', '\n'.join(boots)))
    # 首页不再生成集成入口页，直接由 docs/index.html 承担
    write(os.path.join(OUT, 'favicon.svg'), FAVICON)
    write(os.path.join(OUT, 'favicon.svg'), FAVICON)

    # 文档页：tools/build_docs.py 从 README.md 生成 -> docs-site/index.html
    docs_src = os.path.join(BASE, 'docs-site', 'index.html')
    if os.path.exists(docs_src):
        os.makedirs(os.path.join(OUT, 'docs'), exist_ok=True)
        shutil.copyfile(docs_src, os.path.join(OUT, 'docs', 'index.html'))
        print('  docs       ok')
    else:
        print('  docs       缺失（先跑 python tools/build_docs.py）')

    pkg = {
        'name': 'fullstack-practice-site',
        'private': True,
        'version': '1.0.0',
        'type': 'module',
        'description': '三个全栈项目合成的一个站点：青苔笔记 / 灶台问答 / 一枚手作',
        'main': 'server.js',
        'scripts': {'start': 'node server.js'},
        'engines': {'node': '>=22'},
        'dependencies': {
            'bcryptjs': '^2.4.3',
            'cors': '^2.8.5',
            'express': '^4.21.2',
            'jsonwebtoken': '^9.0.2',
        },
    }
    write(os.path.join(OUT, 'package.json'), json.dumps(pkg, ensure_ascii=False, indent=2) + '\n')
    write(os.path.join(OUT, '.gitignore'), 'node_modules/\n*.sqlite\n.env\n')

    files = sum(len(f) for _, _, f in os.walk(OUT))
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, f in os.walk(OUT) for f in f)
    print(f'完成 → {OUT}  ({files} 个文件, {size / 1024 / 1024:.1f} MB)')


if __name__ == '__main__':
    main()
