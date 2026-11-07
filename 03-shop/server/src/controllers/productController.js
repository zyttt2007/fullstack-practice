import { query, queryOne } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/error.js';

function parseImages(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    stock: row.stock,
    images: parseImages(row.images),
    category: row.category,
    sales: row.sales,
    createdAt: row.created_at,
  };
}

const SORTS = {
  default: 'ORDER BY p.id ASC',
  price_asc: 'ORDER BY p.price ASC',
  price_desc: 'ORDER BY p.price DESC',
  sales: 'ORDER BY p.sales DESC',
  newest: 'ORDER BY p.created_at DESC',
};

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(60, Math.max(1, Number(req.query.pageSize) || 12));
  const { category, keyword, sort = 'default' } = req.query;

  const where = [];
  const params = [];
  if (category) {
    where.push('p.category = ?');
    params.push(String(category));
  }
  if (keyword) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    const kw = `%${String(keyword)}%`;
    params.push(kw, kw);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = SORTS[sort] || SORTS.default;

  const totalRow = await queryOne(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const rows = await query(
    `SELECT p.* FROM products p ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );

  const catRows = await query('SELECT DISTINCT category FROM products ORDER BY category');
  res.json({
    list: rows.map(mapProduct),
    total: totalRow?.total || 0,
    page,
    pageSize,
    categories: catRows.map((r) => r.category),
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);
  if (!row) throw httpError(404, '商品不存在或已下架');
  res.json({ product: mapProduct(row) });
});
