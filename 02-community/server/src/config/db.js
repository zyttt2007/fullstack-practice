/**
 * 统一数据访问层
 * ------------------------------------------------------------------
 * 教程技术选型是 MySQL，因此默认驱动为 mysql2（DB_DRIVER=mysql）。
 * 本机若没有 MySQL 服务，可以设置 DB_DRIVER=sqlite，使用 Node 22 内置的
 * node:sqlite 直接跑起来做演示，业务 SQL 与表结构完全一致。
 *
 * 对外只暴露 4 个方法：query / queryOne / exec / withTransaction
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

export const DRIVER = (process.env.DB_DRIVER || 'mysql').toLowerCase();

/** 生成 'YYYY-MM-DD HH:mm:ss'，两种数据库都能直接写入 DATETIME */
export function now(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

let pool = null;
let sqliteDb = null;

async function getPool() {
  if (pool) return pool;
  const mysql = await import('mysql2/promise');
  pool = mysql.default.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mossnote',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    multipleStatements: true,
  });
  return pool;
}

function getSqlite() {
  if (sqliteDb) return sqliteDb;
  const file = process.env.SQLITE_FILE
    ? path.resolve(ROOT, process.env.SQLITE_FILE)
    : path.join(ROOT, 'data.sqlite');
  sqliteDb = new DatabaseSync(file);
  sqliteDb.exec('PRAGMA foreign_keys = ON');
  return sqliteDb;
}

/** sqlite 不接受 boolean / undefined 参数，统一归一 */
function normalizeParam(v) {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === undefined) return null;
  return v;
}

async function runQuery(sql, params = [], handle = null) {
  const args = params.map(normalizeParam);
  if (DRIVER === 'sqlite') {
    const db = handle?.db || getSqlite();
    return db.prepare(sql).all(...args);
  }
  const conn = handle?.conn || (await getPool());
  const [rows] = await conn.query(sql, args);
  return rows;
}

async function runExec(sql, params = [], handle = null) {
  const args = params.map(normalizeParam);
  if (DRIVER === 'sqlite') {
    const db = handle?.db || getSqlite();
    const res = db.prepare(sql).run(...args);
    return { insertId: Number(res.lastInsertRowid), affectedRows: Number(res.changes) };
  }
  const conn = handle?.conn || (await getPool());
  const [res] = await conn.query(sql, args);
  return { insertId: res.insertId, affectedRows: res.affectedRows };
}

export const query = (sql, params, handle) => runQuery(sql, params, handle);

export async function queryOne(sql, params, handle) {
  const rows = await runQuery(sql, params, handle);
  return rows[0];
}

export const exec = (sql, params, handle) => runExec(sql, params, handle);

/** 事务：回调里用 tx.query / tx.exec，保证同一连接 */
export async function withTransaction(fn) {
  if (DRIVER === 'sqlite') {
    const db = getSqlite();
    const handle = { db };
    db.exec('BEGIN');
    try {
      const result = await fn({
        query: (sql, params) => runQuery(sql, params, handle),
        exec: (sql, params) => runExec(sql, params, handle),
      });
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
  const conn = await getPool().then((p) => p.getConnection());
  const handle = { conn };
  await conn.beginTransaction();
  try {
    const result = await fn({
      query: (sql, params) => runQuery(sql, params, handle),
      exec: (sql, params) => runExec(sql, params, handle),
    });
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** 执行建表脚本（幂等：均使用 CREATE TABLE IF NOT EXISTS） */
export async function initSchema() {
  const file = DRIVER === 'sqlite' ? 'schema.sqlite.sql' : 'schema.mysql.sql';
  const sql = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (DRIVER === 'sqlite') {
    getSqlite().exec(sql);
    return;
  }
  const p = await getPool();
  await p.query(sql);
}
