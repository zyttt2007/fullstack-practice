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

const genOrderNo = () => `HM${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;

const mapOrderItem = (row) => ({
  id: row.id,
  productId: row.product_id,
  name: row.name,
  image: row.image,
  price: Number(row.price),
  quantity: row.quantity,
  subtotal: Number((row.price * row.quantity).toFixed(2)),
});

const mapOrder = (row, items = []) => ({
  id: row.id,
  orderNo: row.order_no,
  status: row.status,
  totalPrice: Number(row.total_price),
  discountAmount: Number(row.discount_amount),
  payAmount: Number(row.pay_amount),
  couponId: row.coupon_id,
  address: row.address_snapshot ? JSON.parse(row.address_snapshot) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items,
});

/** 下单：事务内 校验库存→算金额→占用券→建订单→写快照→扣库存→清购物车 */
export const createOrder = asyncHandler(async (req, res) => {
  const { cartItemIds = [], addressId, couponId } = req.body || {};
  const ids = Array.isArray(cartItemIds) ? cartItemIds.map(Number).filter(Boolean) : [];
  if (!ids.length) throw httpError(400, '请选择要结算的商品');
  if (!addressId) throw httpError(400, '请选择收货地址');

  const address = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [Number(addressId), req.user.id]);
  if (!address) throw httpError(400, '收货地址不存在');

  const placeholders = ids.map(() => '?').join(',');
  const items = await query(
    `SELECT c.id AS cart_item_id, c.quantity, p.id AS product_id, p.name, p.price, p.stock, p.images
     FROM cart_items c JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ? AND c.id IN (${placeholders})`,
    [req.user.id, ...ids]
  );
  if (items.length === 0) throw httpError(400, '购物车中没有选中的商品');
  if (items.length !== ids.length) throw httpError(400, '部分商品已失效，请刷新购物车');

  for (const it of items) {
    if (it.quantity > it.stock) throw httpError(400, `「${it.name}」库存不足（剩 ${it.stock} 件），请调整数量`);
  }

  const total = Number(items.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2));

  // 校验优惠券
  let coupon = null;
  let discount = 0;
  if (couponId) {
    coupon = await queryOne('SELECT * FROM coupons WHERE id = ? AND user_id = ?', [Number(couponId), req.user.id]);
    if (!coupon) throw httpError(400, '优惠券不存在');
    if (coupon.is_used) throw httpError(400, '这张券已经用过了');
    if (total < Number(coupon.min_amount)) {
      throw httpError(400, `未达到「${coupon.title}」的使用门槛（满 ${coupon.min_amount} 可用）`);
    }
    discount = Math.min(Number(coupon.discount), total);
  }
  const payAmount = Number((total - discount).toFixed(2));

  const orderNo = genOrderNo();
  const ts = now();
  const snapshot = JSON.stringify({
    name: address.name,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
  });

  const result = await withTransaction(async (tx) => {
    // 乐观扣库存：stock >= 本次数量才允许扣，防止超卖
    for (const it of items) {
      const r = await tx.exec(
        'UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ? AND stock >= ?',
        [it.quantity, it.quantity, it.product_id, it.quantity]
      );
      if (!r.affectedRows) throw httpError(409, `「${it.name}」库存不足，下单失败`);
    }

    const orderRes = await tx.exec(
      `INSERT INTO orders (order_no, user_id, address_id, address_snapshot, total_price, discount_amount, pay_amount, coupon_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待支付', ?, ?)`,
      [orderNo, req.user.id, address.id, snapshot, total, discount, payAmount, coupon ? coupon.id : null, ts, ts]
    );
    const orderId = orderRes.insertId;

    for (const it of items) {
      await tx.exec(
        'INSERT INTO order_items (order_id, product_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, it.product_id, it.name, parseImages(it.images)[0] || '', it.price, it.quantity]
      );
    }

    // 清空已下单的购物车项
    await tx.exec(`DELETE FROM cart_items WHERE user_id = ? AND id IN (${placeholders})`, [req.user.id, ...ids]);

    // 标记券已用
    if (coupon) await tx.exec('UPDATE coupons SET is_used = 1 WHERE id = ?', [coupon.id]);

    return orderId;
  });

  const order = await queryOne('SELECT * FROM orders WHERE id = ?', [result]);
  const rows = await query('SELECT * FROM order_items WHERE order_id = ?', [result]);
  res.status(201).json({ order: mapOrder(order, rows.map(mapOrderItem)) });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = ['user_id = ?'];
  const params = [req.user.id];
  if (status && status !== '全部') {
    where.push('status = ?');
    params.push(String(status));
  }
  const orders = await query(`SELECT * FROM orders WHERE ${where.join(' AND ')} ORDER BY created_at DESC`, params);
  const list = [];
  for (const o of orders) {
    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
    list.push(mapOrder(o, items.map(mapOrderItem)));
  }
  res.json({ list });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
  if (!order) throw httpError(404, '订单不存在');
  const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.json({ order: mapOrder(order, items.map(mapOrderItem)) });
});

/** 取消订单（仅待支付）：恢复库存、回销量、释放券 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
  if (!order) throw httpError(404, '订单不存在');
  if (order.status !== '待支付') throw httpError(400, '只有「待支付」的订单才能取消');

  await withTransaction(async (tx) => {
    const items = await tx.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    for (const it of items) {
      await tx.exec('UPDATE products SET stock = stock + ?, sales = sales - ? WHERE id = ?', [it.quantity, it.quantity, it.product_id]);
    }
    if (order.coupon_id) {
      await tx.exec('UPDATE coupons SET is_used = 0 WHERE id = ?', [order.coupon_id]);
    }
    await tx.exec("UPDATE orders SET status = '已取消', updated_at = ? WHERE id = ?", [now(), order.id]);
  });

  res.json({ success: true });
});

/** 模拟支付（仅待支付） */
export const payOrder = asyncHandler(async (req, res) => {
  const order = await queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
  if (!order) throw httpError(404, '订单不存在');
  if (order.status !== '待支付') throw httpError(400, '该订单当前状态不能支付');
  await exec("UPDATE orders SET status = '已支付', updated_at = ? WHERE id = ?", [now(), order.id]);
  res.json({ success: true });
});
