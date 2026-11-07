// 发布版冒烟测试：模拟真实用户路径，覆盖事务（点赞去重、积分、下单扣库存）
const B = {
  blog: 'http://127.0.0.1:8080/blog/api',
  comm: 'http://127.0.0.1:8080/community/api',
  shop: 'http://127.0.0.1:8080/shop/api',
};

const post = (url, body, token) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Access-Token': token } : {}) },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }));

const get = (url, token) =>
  fetch(url, { headers: token ? { 'X-Access-Token': token } : {} }).then(async (r) => ({
    status: r.status,
    data: await r.json().catch(() => null),
  }));

const ok = (label, cond, extra = '') =>
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);

(async () => {
  // ---------- 博客 ----------
  const lb = await post(`${B.blog}/auth/login`, { username: '苔痕', password: '123456' });
  const tb = lb.data?.token;
  ok('博客登录', !!tb);

  const cp = await post(`${B.blog}/posts`, {
    title: '线上发布测试：一页纸的散步地图',
    content: '## 为什么用纸\n\n因为手机总会没电。\n\n- 起点\n- 终点\n\n> 记下天气。',
    categoryId: 2,
    tags: ['测试', '漫步'],
    cover: 'gradient:28:🗺️',
    status: 'published',
  }, tb);
  const postId = cp.data?.post?.id;
  ok('博客发文章', cp.status < 400 && !!postId, `id=${postId}`);

  const like1 = await post(`${B.blog}/posts/${postId}/like`, {}, tb);
  const like2 = await post(`${B.blog}/posts/${postId}/like`, {}, tb);
  ok('点赞 + 重复点赞取消', like1.status < 400 && like1.data?.liked === true && like2.data?.liked === false,
     JSON.stringify(like2.data));

  const cm = await post(`${B.blog}/comments`, { postId, content: '自己先评一条。' }, tb);
  ok('博客评论', cm.status < 400);
  const detail = await get(`${B.blog}/posts/${postId}`);
  ok('详情返回评论数/浏览量', detail.data?.post?.commentsCount === 1 && detail.data?.post?.views >= 1,
     `comments=${detail.data?.post?.commentsCount} views=${detail.data?.post?.views}`);

  // ---------- 问答社区 ----------
  const lc = await post(`${B.comm}/auth/login`, { username: '小满', password: '123456' });
  const tc = lc.data?.token;
  const before = (await get(`${B.comm}/auth/me`, tc)).data?.user?.points ?? lc.data?.user?.points;
  const ask = await post(`${B.comm}/questions`, {
    title: '发布版测试：牛排煎完总是出水怎么办？',
    content: '表面擦干了，锅也够热，但一下锅就出一滩水。是不是腌制的问题？',
    tags: ['煎炸'],
  }, tc);
  const qid = ask.data?.question?.id;
  ok('社区提问', ask.status < 400 && !!qid, `id=${qid}`);
  const after = (await get(`${B.comm}/auth/me`, tc)).data?.user?.points;
  ok('提问扣积分（-5）', Number(before) - Number(after) === 5, `${before} → ${after}`);

  // 换成另一位用户来回答（社区规则：不能回答自己的问题）
  const lc2 = await post(`${B.comm}/auth/login`, { username: '李师傅', password: '123456' });
  const ans = await post(`${B.comm}/questions/${qid}/answers`, {
    content: '大概率是肉从冰箱拿出来直接下锅，中心温度太低，遇热析水。提前 20 分钟回温、下锅前再擦一次表面。',
  }, lc2.data?.token);
  ok('不能回答自己的问题（业务规则）', (await post(`${B.comm}/questions/${qid}/answers`, { content: '自问自答测试内容。' }, tc)).status === 400);
  ok('社区回答', ans.status < 400, `id=${ans.data?.answer?.id}`);

  // ---------- 商城 ----------
  const ls = await post(`${B.shop}/auth/login`, { username: '阿禾', password: '123456' });
  const ts = ls.data?.token;
  const prods = await get(`${B.shop}/products?page=1&pageSize=3`);
  const p0 = prods.data?.list?.[0];
  ok('商城商品列表', !!p0, p0?.name);

  await post(`${B.shop}/cart`, { productId: p0.id, quantity: 2 }, ts);
  const cart = await get(`${B.shop}/cart`, ts);
  const cartItems = cart.data?.list || [];
  ok('加入购物车', cartItems.some((i) => i.product?.id === p0.id), `items=${cartItems.length}`);

  const addr = await get(`${B.shop}/addresses`, ts);
  const addrId = addr.data?.list?.[0]?.id;
  ok('地址列表', !!addrId);

  const order = await post(`${B.shop}/orders`, { addressId: addrId, cartItemIds: cartItems.map((i) => i.id) }, ts);
  const orderId = order.data?.order?.id;
  ok('下单（事务扣库存）', order.status < 400 && !!orderId, `order=${order.data?.order?.orderNo} amount=${order.data?.order?.payAmount}`);

  const stockAfter = (await get(`${B.shop}/products/${p0.id}`)).data?.product?.stock;
  ok('库存已扣减', Number(stockAfter) === Number(p0.stock) - 2, `${p0.stock} → ${stockAfter}`);

  const pay = await fetch(`${B.shop}/orders/${orderId}/pay`, { method: 'PUT', headers: { Authorization: 'Bearer ' + ts } }).then((r) => r.status);
  ok('模拟支付', pay < 400, 'HTTP ' + pay);
  const od = await get(`${B.shop}/orders/${orderId}`, ts);
  ok('订单状态已支付', od.data?.order?.status === '已支付', od.data?.order?.status);
})();
