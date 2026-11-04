#!/usr/bin/env node
/**
 * Live check in a real browser: opens the deployed site at desktop and mobile
 * size, walks through the page types, records browser errors and takes
 * screenshots into _check/live/. Run by .github/workflows/live-check.yml (by
 * hand: Actions → Live check → Run workflow), because the cloud sessions that
 * build this site cannot always reach github.io themselves.
 *   node scripts/qa/live.mjs [url]
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const url = (process.argv[2] || 'https://gollshow.github.io/gollshow-site/').replace(/\/?$/, '/');
const out = '_check/live';
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const lines = [`# Live check: ${url}`, '', `Run ${new Date().toISOString()} on a GitHub Actions runner, Chromium ${browser.version()}.`, ''];
const views = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];
const pages = [
  ['01-home', ''],
  ['02-painting', 'painting/'],
  ['03-viewer', 'painting/#1'],
  ['04-film', 'film/'],
  ['05-music', 'music/'],
  ['06-about', 'about/'],
  ['07-old-url-yyy', 'yyy/'],
  ['08-admin', 'admin/'],
];
let failures = 0;
for (const v of views) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.deviceScaleFactor ?? 1, isMobile: v.isMobile, hasTouch: v.hasTouch, locale: 'ko-KR' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  lines.push(`## ${v.name} ${v.viewport.width}×${v.viewport.height}`, '', '| page | status | title | notes |', '|---|---|---|---|');
  for (const [name, path] of pages) {
    errors.length = 0;
    let status = '—';
    try {
      const res = await page.goto(url + path, { waitUntil: 'networkidle', timeout: 45000 });
      status = String(res?.status());
      await sleep(name === '01-home' ? 6000 : 1800); // home: let the pigment gather the wordmark
      if (name === '01-home' && v.name === 'desktop') {
        await page.mouse.move(700, 420, { steps: 10 });
        await sleep(1200);
      }
      const info = await page.evaluate(() => ({
        title: document.title,
        works: document.querySelectorAll('[data-view]').length,
        caption: (document.querySelector('dialog[open] .viewer__cap'))?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 60),
        final: location.pathname,
      }));
      await page.screenshot({ path: `${out}/${v.name}-${name}.jpg`, type: 'jpeg', quality: 80 });
      const note = [info.works ? `${info.works} works` : '', info.caption ? `caption: ${info.caption}` : '', info.final !== new URL(url + path).pathname ? `→ ${info.final}` : '', errors.length ? `errors: ${errors.join(' / ').slice(0, 300)}` : 'no errors']
        .filter(Boolean)
        .join('; ');
      if (errors.length || !/^(200|304)$/.test(status)) failures++;
      lines.push(`| \`/${path}\` | ${status} | ${info.title.replace(/\|/g, '/')} | ${note.replace(/\|/g, '/')} |`);
    } catch (e) {
      failures++;
      lines.push(`| \`/${path}\` | ${status} | — | failed: ${String(e.message).split('\n')[0]} |`);
    }
  }
  lines.push('');
  await ctx.close();
}
await browser.close();
lines.push(failures ? `**${failures} page(s) need a look.**` : 'All pages loaded with status 200 and no browser errors.', '');
fs.writeFileSync(`${out}/report.md`, lines.join('\n'));
console.log(lines.join('\n'));
