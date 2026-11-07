import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';

export const listCoupons = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM coupons WHERE user_id = ? ORDER BY is_used ASC, min_amount ASC', [req.user.id]);
  res.json({
    list: rows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      minAmount: Number(r.min_amount),
      discount: Number(r.discount),
      isUsed: Boolean(r.is_used),
    })),
  });
});
