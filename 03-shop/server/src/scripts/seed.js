import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { exec, now } from '../config/db.js';

const PASSWORD = '123456';

const users = [
  { username: '阿禾', email: 'he@handmadeone.dev', bio: '喜欢一切有手作痕迹的东西。', avatar: 'gradient:16:禾' },
  { username: '小瓷', email: 'ci@handmadeone.dev', bio: '粗陶爱好者，家里已经放不下杯子了。', avatar: 'gradient:14:瓷' },
  { username: '舟舟', email: 'zhou@handmadeone.dev', bio: '文具控。', avatar: 'gradient:45:舟' },
];

const products = [
  { name: '粗陶手冲咖啡杯', category: '器物', price: 128, stock: 20, sales: 156, img: 'gradient:16:☕', created: '2026-08-02 10:00:00',
    desc: '手拉坯成型的粗陶杯，杯壁保留了手指的压痕。\n\n- 容量约 220ml，适合手冲\n- 外壁无釉，手感温润\n- 每只的窑变纹理都不同\n\n> 杯子是拿来用的，不是拿来供着的。' },
  { name: '手捏粗陶小花瓶', category: '器物', price: 89, stock: 12, sales: 98, img: 'gradient:14:🏺', created: '2026-08-10 14:30:00',
    desc: '不用拉坯机，纯手捏的小花器，瓶口故意做得不太圆。\n\n适合插一枝干花，或者什么都不插。' },
  { name: '陶土多肉小花盆', category: '器物', price: 45, stock: 30, sales: 210, img: 'gradient:100:🪴', created: '2026-08-15 09:20:00',
    desc: '红陶花盆，底部留了透气孔，附一个同色小托盘。\n\n种多肉、种小绿植都合适。' },
  { name: '粗陶浅口餐盘', category: '器物', price: 68, stock: 16, sales: 87, img: 'gradient:24:🍽️', created: '2026-08-20 16:00:00',
    desc: '直径 20cm 的浅口盘，盛早餐、盛点心、盛一切都好看。\n\n边缘有一圈手刷的赭石色釉。' },
  { name: '亚麻原色桌布', category: '织物', price: 139, stock: 8, sales: 64, img: 'gradient:40:🧵', created: '2026-09-01 11:00:00',
    desc: '100% 亚麻，未漂染的原色，带一点点天然的麻节。\n\n- 尺寸 140 × 180cm\n- 越洗越软，越用越好看\n\n第一次下水会轻微缩水，已预留尺寸。' },
  { name: '手工编织杯垫（4 只装）', category: '织物', price: 59, stock: 25, sales: 172, img: 'gradient:32:🧶', created: '2026-09-05 15:40:00',
    desc: '棉线手编的杯垫，四只一组，颜色是大地色系。\n\n吸水、隔热、好洗，是那种会一直用下去的小东西。' },
  { name: '羊毛毡杯垫套装', category: '织物', price: 79, stock: 15, sales: 55, img: 'gradient:8:🐑', created: '2026-09-10 10:10:00',
    desc: '厚羊毛毡，手感扎实，杯子放上去没有声音。\n\n一组五只，附一个麻布收纳袋。' },
  { name: '黄铜书签', category: '文具', price: 39, stock: 40, sales: 320, img: 'gradient:45:🔖', created: '2026-09-14 13:00:00',
    desc: '1mm 厚的黄铜片，手工敲出的哑光面。\n\n用久了会氧化出很好看的包浆，这是它最迷人的部分。' },
  { name: '手工牛皮笔记本', category: '文具', price: 96, stock: 18, sales: 143, img: 'gradient:22:📓', created: '2026-09-18 19:30:00',
    desc: '头层牛皮封面 + 100g 米白道林纸，线装可完全摊平。\n\n适合写字，也适合画点小速写。' },
  { name: '黄铜裁纸刀', category: '文具', price: 52, stock: 22, sales: 76, img: 'gradient:48:✂️', created: '2026-09-22 09:00:00',
    desc: '黄铜手柄，配不锈钢刀片，开快递、裁信封都顺手。\n\n握在手里有一点点分量感。' },
  { name: '手工香薰蜡烛（野姜花）', category: '香氛', price: 78, stock: 20, sales: 188, img: 'gradient:14:🕯️', created: '2026-09-26 20:00:00',
    desc: '大豆蜡 + 棉芯，野姜花香调，点起来是干净的绿意。\n\n- 燃烧约 30 小时\n- 粗陶杯身，烧完可以当小花盆\n\n第一烧要烧满两小时，让蜡面平掉。' },
  { name: '古法手工皂（艾草）', category: '香氛', price: 42, stock: 35, sales: 240, img: 'gradient:130:🧼', created: '2026-10-01 08:30:00',
    desc: '冷制皂，晾了 45 天才上架。艾草味很淡，洗完不假滑。\n\n洗脸洗手都可以。' },
];

const addresses = [
  { user: '阿禾', name: '阿禾', phone: '13800001234', province: '浙江省', city: '杭州市', district: '西湖区', detail: '文二西路 88 号 梧桐公寓 3 幢 502', is_default: 1 },
  { user: '阿禾', name: '禾妈妈', phone: '13900005678', province: '浙江省', city: '绍兴市', district: '越城区', detail: '解放北路 12 号 老台门 2 楼', is_default: 0 },
];

const coupons = [
  { user: '阿禾', code: 'HM10', title: '满 99 减 10', min: 99, discount: 10, used: 1 },
  { user: '阿禾', code: 'HM25', title: '满 199 减 25', min: 199, discount: 25, used: 0 },
  { user: '阿禾', code: 'HM40', title: '满 299 减 40', min: 299, discount: 40, used: 0 },
  { user: '小瓷', code: 'HM10', title: '满 99 减 10', min: 99, discount: 10, used: 0 },
  { user: '小瓷', code: 'HM25', title: '满 199 减 25', min: 199, discount: 25, used: 0 },
  { user: '舟舟', code: 'HM10', title: '满 99 减 10', min: 99, discount: 10, used: 0 },
];

const byName = {};
const byId = {};

async function main() {
  await exec('DELETE FROM order_items');
  await exec('DELETE FROM orders');
  await exec('DELETE FROM cart_items');
  await exec('DELETE FROM addresses');
  await exec('DELETE FROM coupons');
  await exec('DELETE FROM products');
  await exec('DELETE FROM users');

  const hash = await bcrypt.hash(PASSWORD, 10);
  const uid = {};
  for (const u of users) {
    const r = await exec(
      'INSERT INTO users (username, email, password, avatar, bio, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [u.username, u.email, hash, u.avatar, u.bio, '2026-07-15 10:00:00']
    );
    uid[u.username] = r.insertId;
  }

  for (const p of products) {
    const r = await exec(
      'INSERT INTO products (name, description, price, stock, images, category, sales, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.name, p.desc, p.price, p.stock, JSON.stringify([p.img]), p.category, p.sales, p.created, p.created]
    );
    byId[p.name] = r.insertId;
    byName[p.name] = p;
  }

  const addrIds = {};
  for (const a of addresses) {
    const r = await exec(
      'INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uid[a.user], a.name, a.phone, a.province, a.city, a.district, a.detail, a.is_default, now()]
    );
    addrIds[a.detail] = r.insertId;
  }

  const couponIds = {};
  for (const c of coupons) {
    const r = await exec(
      'INSERT INTO coupons (code, title, min_amount, discount, user_id, is_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.code, c.title, c.min, c.discount, uid[c.user], c.used, now()]
    );
    couponIds[`${c.user}@${c.code}`] = r.insertId;
  }

  // 阿禾的购物车：黄铜书签 ×2（演示「加入购物车」前先有点内容）
  await exec(
    'INSERT INTO cart_items (user_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?)',
    [uid['阿禾'], byId['黄铜书签'], 2, now()]
  );

  // 一笔「已支付」的订单（用了 HM10，券已核销）
  const addr1 = addresses[0];
  const snapshot1 = JSON.stringify({ name: addr1.name, phone: addr1.phone, province: addr1.province, city: addr1.city, district: addr1.district, detail: addr1.detail });
  const ts1 = '2026-10-20 15:26:00';
  const order1 = await exec(
    `INSERT INTO orders (order_no, user_id, address_id, address_snapshot, total_price, discount_amount, pay_amount, coupon_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '已支付', ?, ?)`,
    ['HM202610200011234', uid['阿禾'], addrIds[addr1.detail], snapshot1, 187, 10, 177, couponIds['阿禾@HM10'], ts1, ts1]
  );
  await exec('INSERT INTO order_items (order_id, product_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
    [order1.insertId, byId['粗陶手冲咖啡杯'], '粗陶手冲咖啡杯', byName['粗陶手冲咖啡杯'].img, 128, 1]);
  await exec('INSERT INTO order_items (order_id, product_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
    [order1.insertId, byId['手工编织杯垫（4 只装）'], '手工编织杯垫（4 只装）', byName['手工编织杯垫（4 只装）'].img, 59, 1]);

  // 一笔「已取消」的订单
  const ts2 = '2026-10-27 21:05:00';
  const order2 = await exec(
    `INSERT INTO orders (order_no, user_id, address_id, address_snapshot, total_price, discount_amount, pay_amount, coupon_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '已取消', ?, ?)`,
    ['HM202610270005678', uid['阿禾'], addrIds[addr1.detail], snapshot1, 156, 0, 156, null, ts2, ts2]
  );
  await exec('INSERT INTO order_items (order_id, product_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
    [order2.insertId, byId['手工香薰蜡烛（野姜花）'], '手工香薰蜡烛（野姜花）', byName['手工香薰蜡烛（野姜花）'].img, 78, 2]);

  console.log(`[seed] 完成：${users.length} 位用户 / ${products.length} 件商品 / 2 个地址 / ${coupons.length} 张券 / 2 笔示例订单`);
  console.log(`[seed] 演示账号密码均为 ${PASSWORD}（例如 阿禾 / 123456）`);
}

main().catch((err) => {
  console.error('[seed] 失败：', err.message);
  process.exit(1);
});
