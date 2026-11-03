#!/usr/bin/env node
/**
 * QA screenshots: desktop 1440×900 and mobile 390×844 of every page type.
 *   node scripts/qa/shoot.mjs <round-prefix> [base-url]
 * Writes _check/<prefix>-<viewport>-<name>.jpg and _check/<prefix>-errors.txt.
 * Uses the Chromium that ships with Playwright in the cloud environment.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const prefix = process.argv[2] || 'r1';
const base = (process.argv[3] || 'http://127.0.0.1:4321/gollshow-site/').replace(/\/?$/, '/');
const only = process.argv[4]?.split(',');
const out = '_check';
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWS = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
for (const v of VIEWS) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.deviceScaleFactor, isMobile: v.isMobile, hasTouch: v.hasTouch, locale: 'ko-KR' });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${v.name}] console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${v.name}] pageerror: ${e.message}`));
  const shot = async (name) => {
    if (only && !only.some((o) => name.includes(o))) return;
    await page.screenshot({ path: `${out}/${prefix}-${v.name}-${name}.jpg`, type: 'jpeg', quality: 82 });
    console.log('shot', v.name, name);
  };
  const go = async (path, wait = 1200) => {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await sleep(wait);
  };

  // 01 opening (fresh session): CSS animations are frozen at given moments so
  // the slow software renderer here cannot make the timing drift
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  const at = (ms) => page.evaluate((t) => document.getAnimations().forEach((a) => (a.pause(), (a.currentTime = t))), ms);
  await at(260);
  await shot('01a-opening-flicker');
  await at(1400);
  await shot('01b-opening-title-card');
  await at(2290);
  await shot('01c-opening-burn');
  await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
  await sleep(3500);
  // 02 the wall, beam on a work
  if (v.name === 'desktop') {
    await page.mouse.move(560, 430, { steps: 8 });
    await sleep(900);
  }
  await shot('02-wall-start');
  // travel along the wall
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.18));
  await sleep(900);
  if (v.name === 'desktop') {
    await page.mouse.move(900, 380, { steps: 8 });
    await sleep(900);
  }
  await shot('03-wall-travel');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.62));
  await sleep(1200);
  await shot('04-wall-conte');
  // 05 projection (viewer)
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(700);
  // project the work nearest the beam (a click on the wall)
  await page.evaluate(() => {
    const links = [...document.querySelectorAll('[data-work]')];
    const cx = innerWidth / 2;
    const near = links.map((a) => [a, Math.abs(a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2 - cx)]).sort((a, b) => a[1] - b[1])[0][0];
    near.click();
  });
  await sleep(1400);
  await shot('05-viewer');
  await page.keyboard.press('ArrowRight');
  await sleep(900);
  await shot('05b-viewer-next');
  await page.keyboard.press('Escape');
  await sleep(500);

  // 06 reel
  await go('painting/');
  await shot('06-reel');
  await page.evaluate(() => scrollBy(0, innerHeight * 2.2));
  await sleep(900);
  await shot('06b-reel-scrolled');
  // 07 work page
  await go('works/gogo/');
  await shot('07-work');
  await go('works/painting-017/');
  await shot('07b-work-untitled');
  // 08 music
  await go('music/');
  await shot('08-music');
  await page.locator('.hd [data-sound-toggle]').first().click().catch(() => {});
  await sleep(2200);
  await shot('08b-music-sound-on');
  await page.locator('.hd [data-sound-toggle]').first().click().catch(() => {});
  // 09 about (credits roll)
  await go('about/', 400);
  await shot('09a-credits-start');
  await page.evaluate(() => scrollTo(0, innerHeight * 1.2));
  await sleep(600);
  await shot('09b-credits');
  await page.evaluate(() => scrollTo(0, innerHeight * 2.6));
  await sleep(600);
  await shot('09c-credits-video');
  // 10 404, menu
  await go('nothing-here/');
  await shot('10-404');
  if (v.name === 'mobile') {
    await go('painting/', 600);
    await page.locator('[data-menu-open]').click();
    await sleep(400);
    await shot('11-menu');
  }
  // 12 English mode
  await go('', 800);
  await page.evaluate(() => {
    localStorage.setItem('goll:lang', 'en');
    window.__gollPrefs?.();
  });
  await go('works/gogo/', 800);
  await shot('12-work-en');
  await page.evaluate(() => localStorage.removeItem('goll:lang'));
  await ctx.close();

  // 13 reduced motion
  const rctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.deviceScaleFactor, isMobile: v.isMobile, hasTouch: v.hasTouch, reducedMotion: 'reduce', locale: 'ko-KR' });
  const rp = await rctx.newPage();
  await rp.goto(base, { waitUntil: 'networkidle' });
  await sleep(800);
  if (!only || only.some((o) => '13-reduced-motion'.includes(o))) await rp.screenshot({ path: `${out}/${prefix}-${v.name}-13-reduced-motion.jpg`, type: 'jpeg', quality: 82 });
  await rctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/${prefix}-errors.txt`, errors.join('\n') + '\n');
console.log(errors.length ? errors.join('\n') : 'no browser errors');
