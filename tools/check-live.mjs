// 线上验收：打开分享链接 → 逐个进入三个子站 → 检查渲染、链接与控制台错误
import puppeteer from 'puppeteer-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.argv[2] || 'https://fullstack-projects.app.workbuddy.host/?sharecode=G66VMBWKQ5';
const OUT = process.argv[3] || 'C:/Users/zyt67/AppData/Local/Temp/shots-live';

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 160));
});
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(BASE, { waitUntil: 'networkidle2' });
await sleep(600);
await page.screenshot({ path: `${OUT}/00-landing.png` });
const title = await page.title();
const cards = await page.$$eval('a', (as) => as.map((a) => a.getAttribute('href')).filter(Boolean));
console.log('[入口]', title, '| 链接:', cards.join(' '));

for (const [name, path] of [['blog', '/blog/'], ['community', '/community/'], ['shop', '/shop/']]) {
  await page.goto(new URL(path, BASE).href, { waitUntil: 'networkidle2' });
  await sleep(1200);
  const info = await page.evaluate(() => ({
    title: document.title,
    h: document.querySelector('h1, h2')?.innerText?.slice(0, 40) || '',
    links: document.querySelectorAll('a').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  console.log(`[${name}] ${info.title} | ${info.h} | links=${info.links} | 横向溢出=${info.overflow}px`);
  await page.screenshot({ path: `${OUT}/1${name}.png` });
}

// 深链接与详情页（验证 SPA 回退 + 子路径路由）
const probes = [
  ['博客详情', '/blog/post/1'],
  ['商品详情', '/shop/product/1'],
  ['问题详情', '/community/question/1'],
];
for (const [name, p] of probes) {
  await page.goto(new URL(p, BASE).href, { waitUntil: 'networkidle2' });
  await sleep(1000);
  const ok = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 90));
  console.log(`[${name}] ${p} → ${ok}`);
  await page.screenshot({ path: `${OUT}/2${name}.png` });
}

// 移动端
await page.setViewport({ width: 390, height: 844 });
await page.goto(new URL('/blog/', BASE).href, { waitUntil: 'networkidle2' });
await sleep(1000);
const m = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await page.screenshot({ path: `${OUT}/3-mobile.png`, fullPage: false });
console.log('[移动端] 横向溢出', m + 'px');

console.log('--- 控制台 / 网络错误 ---');
console.log(errors.length ? errors.slice(0, 8).join('\n') : '无');

await browser.close();
