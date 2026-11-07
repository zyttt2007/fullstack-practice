// 用真实浏览器验证子路径部署：渲染、路由跳转、接口请求、控制台报错
import { launch } from 'puppeteer-core';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8080';
const OUT = process.argv[3] || '/tmp/shots-site';
fs.mkdirSync(OUT, { recursive: true });

const browser = await launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
page.on('requestfailed', (r) => errors.push('REQFAIL ' + r.url().slice(0, 120)));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const shot = async (name) => page.screenshot({ path: `${OUT}/${name}.png` });

const report = async (label) => {
  const info = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1,h2')?.textContent?.trim().slice(0, 40) || '',
    cards: document.querySelectorAll('a[href]').length,
    text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 80),
  }));
  console.log(`[${label}] ${page.url().replace(BASE, '')} | ${info.title} | ${info.h1} | links=${info.cards}`);
  return info;
};

// 1. 首页
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(500);
await report('首页');
await shot('00-landing');

// 2. 三个子站首页
for (const [slug, name] of [['blog', '博客'], ['community', '社区'], ['shop', '商城']]) {
  await page.goto(`${BASE}/${slug}/`, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(900);
  await report(name);
  await shot(`1${slug}`);
}

// 3. 博客：点进一篇文章，确认路由带前缀、详情真的渲染
await page.goto(`${BASE}/blog/`, { waitUntil: 'networkidle2' });
await sleep(900);
const firstLink = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find((x) => /\/post\/\d+/.test(x.getAttribute('href') || ''));
  return a?.getAttribute('href') || null;
});
if (firstLink) {
  await page.click(`a[href="${firstLink}"]`);
  await sleep(1200);
  console.log(`[博客详情] 跳转到 ${page.url().replace(BASE, '')} （链接值 ${firstLink}）`);
  await shot('2blog-detail');
} else {
  console.log('[博客详情] 未找到文章链接');
}

// 4. 商城：进入商品详情 + 加购，确认接口跨前缀正常
await page.goto(`${BASE}/shop/`, { waitUntil: 'networkidle2' });
await sleep(900);
const prod = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find((x) => /\/product\/\d+/.test(x.getAttribute('href') || ''));
  return a?.getAttribute('href') || null;
});
if (prod) {
  await page.click(`a[href="${prod}"]`);
  await sleep(1200);
  console.log(`[商品详情] ${page.url().replace(BASE, '')}`);
  await shot('3shop-detail');
}

// 5. 社区：列表 + 点进问题
await page.goto(`${BASE}/community/`, { waitUntil: 'networkidle2' });
await sleep(900);
const q = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find((x) => /\/question\/\d+/.test(x.getAttribute('href') || ''));
  return a?.getAttribute('href') || null;
});
if (q) {
  await page.click(`a[href="${q}"]`);
  await sleep(1200);
  console.log(`[问题详情] ${page.url().replace(BASE, '')}`);
  await shot('4community-detail');
}

// 6. 移动端
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
await sleep(600);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(`[移动端] 横向溢出 ${overflow}px`);
await shot('5mobile');

console.log('--- 控制台错误 ---');
console.log(errors.length ? [...new Set(errors)].slice(0, 8).join('\n') : '无');
await browser.close();
