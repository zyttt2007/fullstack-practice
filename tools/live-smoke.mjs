// 线上验收：在真实公网链接上跑一遍完整业务流（带分享口令）
const BASE = 'https://fullstack-projects.app.workbuddy.host';
const CODE = 'G66VMBWKQ5';

const withCode = (u, token) =>
  u + (u.includes('?') ? '&' : '?') + 'sharecode=' + CODE + (token ? '&token=' + encodeURIComponent(token) : '');

async function req(method, url, body, token) {
  const r = await fetch(withCode(url, token), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'X-Access-Token': token, Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 80); }
  return { status: r.status, data };
}
const post = (u, b, t) => req('POST', u, b, t);
const put = (u, b, t) => req('PUT', u, b || {}, t);
const get = (u, t) => req('GET', u, null, t);

let pass = 0, fail = 0;
function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log('PASS ', name, extra ? ' ' + extra : ''); }
  else { fail++; console.log('FAIL ', name, extra ? ' ' + extra : ''); }
}

const B = {
  blog: BASE + '/blog/api',
  comm: BASE + '/community/api',
  shop: BASE + '/shop/api',
};

// ---------- 博客 ----------
const rb = await post(`${B.blog}/auth/register`, {
  username: 'live' + Date.now().toString().slice(-6),
  email: 'live' + Date.now().toString().slice(-6) + '@example.com',
  password: '123456',
  nickname: '线上验收',
});
ok('博客注册新用户', rb.status < 400 && !!rb.data?.token, `HTTP ${rb.status}`);
const tb = rb.data?.token;

const cp = await post(`${B.blog}/posts`, {
  title: '线上验收：这篇是刚在公网写下的',
  content: '## 线上可写\n\n- 登录用 JWT\n- 数据落在 SQLite\n\n> 这条内容来自真实部署环境。',
  categoryId: 2,
  tags: ['线上'],
  status: 'published',
}, tb);
const pid = cp.data?.post?.id;
ok('博客发文章', cp.status < 400 && !!pid, `id=${pid}`);

const like = await post(`${B.blog}/posts/${pid}/like`, {}, tb);
ok('点赞', like.status < 400, JSON.stringify(like.data));

const cm = await post(`${B.blog}/comments`, { postId: pid, content: '线上评论，验证写入。' }, tb);
ok('评论', cm.status < 400, `HTTP ${cm.status}`);

const det = await get(`${B.blog}/posts/${pid}`);
ok('详情带回评论数', det.data?.post?.commentsCount >= 1 && det.data?.post?.views >= 1,
  `comments=${det.data?.post?.commentsCount} views=${det.data?.post?.views}`);

// ---------- 问答 ----------
const lc = await post(`${B.comm}/auth/login`, { username: '小满', password: '123456' });
const tc = lc.data?.token;
ok('社区登录', !!tc);

const before = (await get(`${B.comm}/auth/me`, tc)).data?.user?.points;
const ask = await post(`${B.comm}/questions`, {
  title: '线上验收：电饭煲煮饭总是夹生怎么办',
  content: '按说明书的水量，跳闸后打开还是硬的，再按一次又会糊底，想知道问题出在哪一步。',
  tags: ['米面'],
}, tc);
const qid = ask.data?.question?.id;
ok('社区提问', ask.status < 400 && !!qid, `id=${qid}`);
const after = (await get(`${B.comm}/auth/me`, tc)).data?.user?.points;
ok('提问扣 5 分', before - after === 5, `${before} → ${after}`);

const lc2 = await post(`${B.comm}/auth/login`, { username: '李师傅', password: '123456' });
const ans = await post(`${B.comm}/questions/${qid}/answers`, {
  content: '多半是水量偏少加上没焖。跳闸后别急着开盖，焖 10 分钟；米提前泡 20 分钟更稳。',
}, lc2.data?.token);
ok('他人回答', ans.status < 400, `id=${ans.data?.answer?.id}`);

// ---------- 商城 ----------
const ls = await post(`${B.shop}/auth/login`, { username: '阿禾', password: '123456' });
const ts = ls.data?.token;
ok('商城登录', !!ts);

const list = await get(`${B.shop}/products?page=1&pageSize=3`);
const p0 = list.data?.list?.[0] ?? list.data?.products?.[0];
ok('商品列表', !!p0, p0?.name);

const stock0 = p0.stock;
await post(`${B.shop}/cart`, { productId: p0.id, quantity: 2 }, ts);
const cart = await get(`${B.shop}/cart`, ts);
const items = cart.data?.list || [];
ok('加入购物车', items.some((i) => i.product?.id === p0.id), `${items.length} 项`);

const addr = await get(`${B.shop}/addresses`, ts);
const addrId = addr.data?.list?.[0]?.id;
ok('收货地址可用', !!addrId);

const order = await post(`${B.shop}/orders`, {
  addressId: addrId,
  cartItemIds: items.map((i) => i.id),
  couponId: null,
  remark: '线上验收订单',
}, ts);
const oid = order.data?.order?.id;
ok('下单（事务扣库存）', order.status < 400 && !!oid,
  `order=${order.data?.order?.orderNo} amount=${order.data?.order?.payAmount}`);

const after1 = (await get(`${B.shop}/products/${p0.id}`)).data?.product?.stock;
ok('库存已扣减', after1 < stock0, `${stock0} → ${after1}`);

const pay = await put(`${B.shop}/orders/${oid}/pay`, {}, ts);
ok('模拟支付', pay.status < 400, `HTTP ${pay.status}`);

const od = await get(`${B.shop}/orders/${oid}`, ts);
ok('订单状态已支付', od.data?.order?.status === '已支付', od.data?.order?.status);

console.log(`\n合计 ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
