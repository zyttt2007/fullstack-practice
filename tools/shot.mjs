/**
 * 通用截图脚本（puppeteer-core + 本机 Edge）
 * 用法：node shot.mjs <目标目录名> <baseUrl> <流程名 blog|community|shop>
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.resolve(process.cwd(), '../shots');

const [project, base, flow] = process.argv.slice(2);
const dir = path.join(OUT, project);
fs.mkdirSync(dir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, tags = 'a,button') {
  const handles = await page.$$(tags);
  for (const h of handles) {
    const t = await page.evaluate((el) => el.textContent || '', h);
    if (t.includes(text)) {
      await h.click();
      return true;
    }
  }
  throw new Error(`找不到可点击元素：${text}`);
}

async function typeInto(page, selector, text, clear = true) {
  const el = await page.waitForSelector(selector, { timeout: 8000 });
  await el.focus();
  if (clear) {
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
  }
  await page.keyboard.type(text, { delay: 6 });
}

const shot = async (page, name, fullPage = false) => {
  await sleep(700);
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage });
  console.log('  ✓', name);
};

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
page.on('console', (m) => {
  if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 200));
});
page.on('pageerror', (e) => console.log('  [pageerror]', String(e).slice(0, 200)));

const go = async (url) => {
  await page.goto(`${base}${url}`, { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(500);
};

console.log(`\n[${project}] ${base} (${flow})`);

/* ---------------- 流程 1：博客 青苔笔记 ---------------- */
if (flow === 'blog') {
  await go('/');
  await shot(page, '01-首页-文章列表', true);

  await page.click('a[href^="/post/"]');
  await sleep(900);
  await shot(page, '02-文章详情-Markdown渲染');

  await page.evaluate(() => window.scrollBy(0, 900));
  await shot(page, '03-文章详情-评论区');

  await go('/login');
  await shot(page, '04-登录页');
  await clickText(page, '登录', 'button');
  await sleep(1200);

  await go('/write');
  await typeInto(page, 'input[placeholder="文章标题"]', '雨停之后，我又去了一次北岸');
  await typeInto(
    page,
    'textarea',
    '## 一个晚上的记录\n\n雨停得比预报早了半小时，我抓起相机就出门了。\n\n- 闸门口积水还没退\n- 芦苇被压弯了一片\n- 有个小孩在数台阶\n\n> 走同一条路的好处是：你能看见它变了。\n\n回来路上买了豆浆，热的。'
  );
  await typeInto(page, 'input[placeholder="标签，逗号分隔"]', '城市漫步, 雨');
  await shot(page, '05-写文章-左编辑右预览');

  await clickText(page, '发布文章', 'button');
  await sleep(1600);
  await shot(page, '06-发布成功-新文章详情');

  await go('/profile');
  await shot(page, '07-个人中心-我的文章');
  await clickText(page, '草稿箱', 'button');
  await sleep(900);
  await shot(page, '08-个人中心-草稿箱');

  await go('/archive');
  await shot(page, '09-归档页-按月');

  await go('/');
  await typeInto(page, 'input[placeholder="搜索标题或正文…"]', '咖啡');
  await page.keyboard.press('Enter');
  await sleep(1200);
  await shot(page, '10-搜索结果');
}

/* ---------------- 流程 2：问答社区 灶台问答 ---------------- */
if (flow === 'community') {
  await go('/');
  await shot(page, '01-首页-问题列表', true);

  await clickText(page, '热门', 'button');
  await sleep(900);
  await shot(page, '02-排序-热门');

  await go('/');
  await page.click('a[href^="/question/"]');
  await sleep(1000);
  await shot(page, '03-问题详情-回答与点赞');

  await go('/ask');
  await shot(page, '04-提问页（未登录跳登录）');

  await go('/login');
  await shot(page, '05-登录页');
  await clickText(page, '登录', 'button');
  await sleep(1200);

  await go('/ask');
  await typeInto(page, 'input[placeholder*="一句话"]', '煎饺子总是粘锅，是锅的问题还是火的问题？');
  await typeInto(
    page,
    'textarea',
    '家里是不粘锅，每次煎冷冻饺子底都会破。\n\n已经试过的办法：\n- 多放油\n- 小火慢煎\n\n还是不行，想知道是锅不行还是我火候不对。'
  );
  await typeInto(page, 'input[placeholder*="标签"]', '煎炸, 锅具');
  await shot(page, '06-提问页-编辑中');
  await clickText(page, '发布问题', 'button');
  await sleep(1500);
  await shot(page, '07-我的问题-提问成功');

  await go('/');
  await clickText(page, '手擀面和面要醒多久', 'a');
  await sleep(1000);
  await clickText(page, '♡', 'button');
  await sleep(900);
  await shot(page, '08-点赞后-状态变化');

  await go('/leaderboard');
  await shot(page, '09-积分排行榜');

  await go('/mine');
  await shot(page, '10-我的主页-积分');
}

/* ---------------- 流程 3：在线商城 一枚手作 ---------------- */
if (flow === 'shop') {
  await go('/');
  await shot(page, '01-首页-商品列表', true);

  await page.click('a[href^="/product/"]');
  await sleep(1000);
  await shot(page, '02-商品详情');

  // 未登录点「加入购物车」会跳登录
  await clickText(page, '加入购物车', 'button');
  await sleep(900);
  await shot(page, '03-未登录跳转登录页');
  await go('/login');
  await clickText(page, '登录', 'button');
  await sleep(1300);

  // 登录后再加一次购物车
  await go('/');
  await page.click('a[href^="/product/"]');
  await sleep(900);
  await clickText(page, '加入购物车', 'button');
  await sleep(1100);
  await go('/cart');
  await shot(page, '04-购物车', true);

  await clickText(page, '去结算', 'button');
  await sleep(1300);
  // 选一张满足门槛的满减券
  try {
    await clickText(page, '满 199 减 25', 'button');
    await sleep(500);
  } catch {}
  await shot(page, '05-结算页-地址与优惠券', true);

  await clickText(page, '提交订单', 'button');
  await sleep(1700);
  await shot(page, '06-订单创建成功-待支付');

  await clickText(page, '模拟支付', 'button');
  await sleep(1200);
  await shot(page, '07-模拟支付-已支付');

  await go('/orders');
  await shot(page, '08-订单列表', true);

  await go('/addresses');
  await shot(page, '09-地址管理', true);

  await go('/');
  await typeInto(page, 'input[placeholder="搜索商品…"]', '杯');
  await page.keyboard.press('Enter');
  await sleep(1100);
  await shot(page, '10-商品搜索');
}

await browser.close();
console.log(`[${project}] 截图完成 -> ${dir}`);
