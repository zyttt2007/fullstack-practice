import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DRIVER, initSchema } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

async function main() {
  if (DRIVER === 'sqlite') {
    const file = path.join(ROOT, process.env.SQLITE_FILE || 'data.sqlite');
    if (fs.existsSync(file)) fs.rmSync(file);
    await initSchema();
    console.log(`[init] SQLite 建表完成 -> ${file}`);
    return;
  }

  const mysql = await import('mysql2/promise');
  const conn = await mysql.default.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  const sql = fs.readFileSync(path.join(ROOT, 'schema.mysql.sql'), 'utf8');
  await conn.query(sql);
  await conn.end();
  console.log(`[init] MySQL 建表完成（库：${process.env.DB_NAME || 'mossnote'}）`);
}

main().catch((err) => {
  console.error('[init] 失败：', err.message);
  process.exit(1);
});
