import { query, queryOne, exec, withTransaction, now } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/error.js';

const mapAddress = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  province: row.province,
  city: row.city,
  district: row.district,
  detail: row.detail,
  isDefault: Boolean(row.is_default),
  createdAt: row.created_at,
});

function validate(body) {
  const { name, phone, province, city, district, detail } = body || {};
  if (!String(name || '').trim()) throw httpError(400, '收货人不能为空');
  if (!/^\d{7,15}$/.test(String(phone || '').trim())) throw httpError(400, '手机号格式不正确');
  for (const [label, value] of [['省', province], ['市', city], ['区/县', district], ['详细地址', detail]]) {
    if (!String(value || '').trim()) throw httpError(400, `${label}不能为空`);
  }
  return {
    name: String(name).trim(),
    phone: String(phone).trim(),
    province: String(province).trim(),
    city: String(city).trim(),
    district: String(district).trim(),
    detail: String(detail).trim(),
  };
}

export const listAddresses = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [req.user.id]);
  res.json({ list: rows.map(mapAddress) });
});

export const createAddress = asyncHandler(async (req, res) => {
  const data = validate(req.body);

  const result = await withTransaction(async (tx) => {
    if (req.body.isDefault) {
      await tx.exec('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    // 第一个地址自动设为默认；显式勾选默认也生效
    const cnt = (await tx.query('SELECT COUNT(*) AS c FROM addresses WHERE user_id = ?', [req.user.id]))[0].c;
    const autoDefault = req.body.isDefault || cnt === 0 ? 1 : 0;
    return tx.exec(
      'INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, data.name, data.phone, data.province, data.city, data.district, data.detail, autoDefault, now()]
    );
  });

  const row = await queryOne('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
  res.status(201).json({ address: mapAddress(row) });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const exist = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!exist) throw httpError(404, '地址不存在');

  const data = validate({ ...exist, ...req.body });
  const isDefault = req.body.isDefault !== undefined ? (req.body.isDefault ? 1 : 0) : exist.is_default;

  await withTransaction(async (tx) => {
    if (isDefault) await tx.exec('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await tx.exec(
      'UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, is_default = ? WHERE id = ?',
      [data.name, data.phone, data.province, data.city, data.district, data.detail, isDefault, id]
    );
  });
  const row = await queryOne('SELECT * FROM addresses WHERE id = ?', [id]);
  res.json({ address: mapAddress(row) });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const exist = await queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!exist) throw httpError(404, '地址不存在');

  await withTransaction(async (tx) => {
    await tx.exec('DELETE FROM addresses WHERE id = ?', [id]);
    if (exist.is_default) {
      // 删除的是默认地址 → 把第一个设为默认
      const first = await tx.query('SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at ASC LIMIT 1', [req.user.id]);
      if (first.length) await tx.exec('UPDATE addresses SET is_default = 1 WHERE id = ?', [first[0].id]);
    }
  });
  res.json({ success: true });
});
