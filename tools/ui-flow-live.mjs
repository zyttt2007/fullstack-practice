// 线上真实点击流程：登录 → 写文章发布 / 提问 / 加购下单
import puppeteer from 'puppeteer-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ROOT = 'https://fullstack-projects.app.workbuddy.host';
const LINK = ROOT + '/?sharecode=G66VMBWKQ5';
const OUT = 'C:/Users/zyt67/AppData/Local/Temp/shots-live';

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(28, 110)}`); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 用原生 setter 赋值，保证 React 受控组件能收到中文
async function fill(selector, value, index = 0) {
  const handles = await page.$$(selector);
  const el = handles[index];
  if (!el) throw new Error('找不到输入框 ' + selector + ' #' + index);
  await el.click();
  await page.evaluate(
    (node, v) => {
      const setter = Object.getOwnPropertyDescriptor(node.constructor.prototype, 'value').set;
      setter.call(node, v);
      node.dispatchEvent(new Event('input', { bubbles: true }));
    },
    el,
    value
  );
}

async function enter() {
  await page.keyboard.press('Enter');
  await sleep(2000);
}

// 0) 先访问带口令的入口，拿到访问 cookie
await page.goto(LINK, { waitUntil: 'networkidle2' });
await sleep(500);

// 1) 博客：登录 → 写文章 → 发布
await page.goto(ROOT + '/blog/login', { waitUntil: 'networkidle2' });
await sleep(1000);
await fill('input', '苔痕', 0);
await fill('input', '123456', 1);
await enter();
const blogToken = await page.evaluate(() => localStorage.getItem('mossnote_token'));
console.log('[博客登录]', blogToken ? '成功，token 已存储' : '失败');
await page.screenshot({ path: `${OUT}/10-blog-logged.png` });

await page.goto(ROOT + '/blog/write', { waitUntil: 'networkidle2' });
await sleep(1200);
await fill('input', '线上验收：在公网写下的第一篇');
await fill('textarea', '## 这篇是在公网环境写的\n\n- 登录用的是 JWT\n- 数据落在 SQLite\n\n> 说明部署环境确实可以写入。', 0);
await sleep(400);
const btns = await page.$$eval('button', (bs) => bs.map((b) => b.innerText.trim()).filter(Boolean));
console.log('[写文章页] 按钮有：', btns.join(' / '));
const pub = await page.$$('button');
let published = false;
for (const b of pub) {
  const t = await page.evaluate((el) => el.innerText.trim(), b);
  if (t.includes('发布')) { await b.click(); published = true; break; }
}
console.log('[发布] 点击发布按钮：', published);
await sleep(2600);
const afterPublish = page.url();
const detailText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 90));
console.log('[发布后]', afterPublish.replace(ROOT, ''), '|', detailText);
await page.screenshot({ path: `${OUT}/11-blog-published.png` });

// 2) 商城：登录 → 加购 → 结算 → 下单
await page.goto(ROOT + '/shop/login', { waitUntil: 'networkidle2' });
await sleep(1000);
await fill('input', '阿禾', 0);
await fill('input', '123456', 1);
await enter();
const shopToken = await page.evaluate(() => localStorage.getItem('handmadeone_token'));
console.log('[商城登录]', shopToken ? '成功' : '失败');

await page.goto(ROOT + '/shop/', { waitUntil: 'networkidle2' });
await sleep(1200);
await page.click('a[href*="/product/"]');
await sleep(1400);
const addBtn = await page.$$('button');
for (const b of addBtn) {
  const t = await page.evaluate((el) => el.innerText.trim(), b);
  if (t.includes('加入购物车')) { await b.click(); break; }
}
await sleep(1200);
await page.goto(ROOT + '/shop/cart', { waitUntil: 'networkidle2' });
await sleep(1200);
const cartText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 80));
console.log('[购物车]', cartText);
await page.screenshot({ path: `${OUT}/12-shop-cart.png` });

for (const b of await page.$$('button')) {
  const t = await page.evaluate((el) => el.innerText.trim(), b);
  if (t.includes('去结算')) { await b.click(); break; }
}
await sleep(1800);
const checkoutText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 100));
console.log('[结算页]', checkoutText);
await page.screenshot({ path: `${OUT}/13-shop-checkout.png` });

for (const b of await page.$$('button')) {
  const t = await page.evaluate((el) => el.innerText.trim(), b);
  if (t.includes('提交订单')) { await b.click(); break; }
}
await sleep(2600);
console.log('[下单后]', page.url().replace(ROOT, ''), '|',
  await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 100)));
await page.screenshot({ path: `${OUT}/14-shop-order.png` });

// 3) 社区：登录 → 提问
await page.goto(ROOT + '/community/login', { waitUntil: 'networkidle2' });
await sleep(1000);
await fill('input', '小满', 0);
await fill('input', '123456', 1);
await enter();
console.log('[社区登录]', (await page.evaluate(() => localStorage.getItem('hearthask_token'))) ? '成功' : '失败');

await page.goto(ROOT + '/community/ask', { waitUntil: 'networkidle2' });
await sleep(1200);
await fill('input', '线上验收：蒸蛋羹总是蜂窝状怎么办');
await fill('textarea', '用温水调蛋液、盖了盘子，中小火蒸 12 分钟，出锅还是有很多孔，是火太大还是时间太长？', 0);
await sleep(400);
for (const b of await page.$$('button')) {
  const t = await page.evaluate((el) => el.innerText.trim(), b);
  if (t.includes('发布') || t.includes('提问')) { await b.click(); break; }
}
await sleep(2600);
console.log('[提问后]', page.url().replace(ROOT, ''), '|',
  await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 90)));
await page.screenshot({ path: `${OUT}/15-community-ask.png` });

console.log('--- 错误 ---');
console.log(errors.length ? [...new Set(errors)].slice(0, 8).join('\n') : '无');
await browser.close();
