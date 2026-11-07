import { query, queryOne, exec, withTransaction, now } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/error.js';

function parseImages(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const mapCartRow = (row) => ({
  id: row.id,
  quantity: row.quantity,
  product: {
    id: row.product_id,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    image: parseImages(row.images)[0] || '',
    category: row.category,
  },
  subtotal: Number((row.price * row.quantity).toFixed(2)),
});

/** 购物车列表 + 总价 */
export const getCart = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT c.id, c.quantity, p.id AS product_id, p.name, p.price, p.stock, p.images, p.category
     FROM cart_items c JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ? ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  const list = rows.map(mapCartRow);
  const total = Number(list.reduce((s, x) => s + x.subtotal, 0).toFixed(2));
  res.json({ list, total });
});

/** 加入购物车：已有则数量累加；校验库存 */
export const addToCart = asyncHandler(async (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Math.max(1, Number(req.body.quantity) || 1);
  if (!productId) throw httpError(400, '缺少 productId');

  const product = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
  if (!product) throw httpError(404, '商品不存在');

  await withTransaction(async (tx) => {
    const exist = await tx.query('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    const newQty = (exist[0]?.quantity || 0) + quantity;
    if (newQty > product.stock) {
      throw httpError(400, `库存不足：「${product.name}」只剩 ${product.stock} 件`);
    }
    if (exist.length) {
      await tx.exec('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, exist[0].id]);
    } else {
      await tx.exec('INSERT INTO cart_items (user_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?)', [req.user.id, productId, quantity, now()]);
    }
  });

  const rows = await query('SELECT COUNT(*) AS c, COALESCE(SUM(quantity), 0) AS n FROM cart_items WHERE user_id = ?', [req.user.id]);
  res.status(201).json({ success: true, cartCount: rows[0]?.n || 0 });
});

/** 修改数量（不允许超过库存，最小 1） */
export const updateCartItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const quantity = Math.max(1, Number(req.body.quantity) || 1);

  const item = await queryOne('SELECT c.*, p.stock, p.name FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?', [id, req.user.id]);
  if (!item) throw httpError(404, '购物车中没有这件商品');
  if (quantity > item.stock) throw httpError(400, `库存不足：只剩 ${item.stock} 件`);

  await exec('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
  res.json({ success: true });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const r = await exec('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!r.affectedRows) throw httpError(404, '购物车中没有这件商品');
  res.json({ success: true });
});
