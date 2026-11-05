#!/usr/bin/env node
/**
 * QA screenshots of every page type (headless Chromium):
 *   node scripts/qa/shots.mjs [base-url] [out-dir] [only]
 * e.g. node scripts/qa/shots.mjs http://localhost:4321/gollshow-site/ _check
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const base = (process.argv[2] || 'http://localhost:4321/gollshow-site/').replace(/\/?$/, '/');
const out = process.argv[3] || '_check';
const only = process.argv[4];
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
async function shot(name, path, { w = 1440, h = 900, wait = 600, bg = 'white', lang, mobile = false, full = false, act } = {}) {
  if (only && !name.includes(only)) return;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('gollshow:lang', l), lang);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: pageerror ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: console ${m.text()}`));
  const sep = path.includes('?') ? '&' : '?';
  await page.goto(base + path + (path.includes('#') ? '' : `${sep}bg=${bg}`), { waitUntil: 'load' });
  if (full) {
    // let lazy images load before a full-page capture
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
  }
  if (act) await act(page);
  await sleep(wait);
  await page.screenshot({ path: `${out}/${name}.jpg`, quality: 78, type: 'jpeg', fullPage: full });
  await ctx.close();
  console.log('✓', name);
}
if (!process.env.NOHOME) await shot('home-white-mid', '', { wait: 1500 });
if (!process.env.NOHOME) await shot('home-white-settled', '', { wait: 9000 });
if (!process.env.NOHOME) await shot('home-black-mid', '', { wait: 1500, bg: 'black' });
if (!process.env.NOHOME) await shot('home-black-settled', '', { wait: 9000, bg: 'black' });
if (!process.env.NOHOME) await shot('home-375-mobile', '', { w: 375, h: 812, mobile: true, wait: 9000 });
await shot('painting-white', 'painting/', { full: true, wait: 3500 });
await shot('conte-pastel-black', 'conte-pastel/', { bg: 'black', wait: 3500 });
await shot('digital-white-ko', 'digital/', { lang: 'ko', wait: 3500 });
await shot('painting-375', 'painting/', { w: 375, h: 812, mobile: true, wait: 3500 });
await shot('viewer-white', 'painting/', { wait: 1400, act: async (p) => { await p.click('.cell__link >> nth=0'); } });
await shot('viewer-black', 'conte-pastel/', { bg: 'black', wait: 1400, act: async (p) => { await p.click('.cell__link >> nth=4'); } });
await shot('viewer-375', 'painting/', { w: 375, h: 812, mobile: true, wait: 1400, act: async (p) => { await p.click('.cell__link >> nth=5'); } });
await shot('film-list', 'film/', { full: true, wait: 3500 });
await shot('film-detail', 'film/unheard/', { full: true, bg: 'black', wait: 3500 });
await shot('music', 'music/', { full: true, wait: 3500 });
await shot('about', 'about/', { full: true, bg: 'black', wait: 3500 });
await shot('about-ko', 'about/', { full: true, lang: 'ko', wait: 3500 });
await shot('menu-375', 'about/', { w: 375, h: 812, mobile: true, act: async (p) => { await p.click('[data-menu-open]'); } });
await shot('404', 'no-such-page/');
// /admin: Sveltia loads from unpkg; SVELTIA_JS can point at a local copy of the same pinned version.
if (!only || 'admin'.includes(only)) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ko-KR' });
  const page = await ctx.newPage();
  if (process.env.SVELTIA_JS) await page.route(/unpkg\.com\/@sveltia\/cms@[^/]+\/dist\/sveltia-cms\.js/, (r) => r.fulfill({ path: process.env.SVELTIA_JS, contentType: 'text/javascript' }));
  const logs = [];
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(base + 'admin/', { waitUntil: 'load' });
  await sleep(4000);
  await page.screenshot({ path: `${out}/admin.jpg`, quality: 78, type: 'jpeg' });
  const text = await page.evaluate(() => document.body.innerText.slice(0, 600));
  fs.writeFileSync(`${out}/admin.txt`, text + '\n---\n' + logs.join('\n') + '\n');
  console.log('✓ admin');
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/errors.txt`, errors.join('\n') + '\n');
console.log(errors.length ? errors.join('\n') : 'no browser errors');
