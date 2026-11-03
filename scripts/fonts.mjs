#!/usr/bin/env node
/**
 * Self-hosted, subset web fonts (both SIL OFL 1.1):
 *   Hahmlet ExtraLight 200 → goll-200.woff2   display: room names, titles, credits
 *   Hahmlet Regular 400    → goll-400.woff2   reading and interface
 *     (static instances of the variable font: ~27 KB each instead of ~70 KB)
 *   Noto Serif KR 400      → fallback.woff2   only characters Hahmlet lacks
 *                                             (空, ㎜, rare Hangul, Hanja)
 *
 *   node scripts/fonts.mjs dist     after `astro build`: subset to exactly the
 *                                   characters used in dist/**.html|js
 *   node scripts/fonts.mjs --dev    for `astro dev`: common Korean (KS X 1001)
 *                                   + Latin into public/fonts (git-ignored)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';
import opentype from 'opentype.js';

const req = createRequire(import.meta.url);
const pkg = (name) => path.dirname(req.resolve(`${name}/package.json`));
const HAHMLET = 'scripts/fonts/Hahmlet-VF.ttf';
const NOTO = path.join(pkg('@expo-google-fonts/noto-serif-kr'), '400Regular/NotoSerifKR_400Regular.ttf');

// Always include: printable ASCII, Latin-1, typographic punctuation.
const BASE = (() => {
  let s = '';
  for (let c = 0x20; c < 0x7f; c++) s += String.fromCharCode(c);
  for (let c = 0xa0; c <= 0xff; c++) s += String.fromCharCode(c);
  return s + '‘’“”–—…·•×−空㎜「」『』〈〉《》、。';
})();

function ksx1001() {
  const dec = new TextDecoder('euc-kr');
  let s = '';
  for (let hi = 0xb0; hi <= 0xc8; hi++) for (let lo = 0xa1; lo <= 0xfe; lo++) s += dec.decode(new Uint8Array([hi, lo]));
  return s;
}

function walk(dir, exts, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc);
    else if (exts.some((x) => p.endsWith(x))) acc.push(p);
  }
  return acc;
}

const arg = process.argv[2];
let text;
let outDir;
if (arg === '--dev') {
  outDir = 'public/fonts';
  if (['goll-200', 'goll-400', 'fallback'].every((f) => fs.existsSync(path.join(outDir, f + '.woff2')))) {
    console.log('fonts: dev subsets already present');
    process.exit(0);
  }
  text = BASE + ksx1001();
} else {
  const dist = arg || 'dist';
  outDir = path.join(dist, 'fonts');
  const files = walk(dist, ['.html', '.js', '.json', '.xml']).filter((f) => !f.includes(`${path.sep}admin${path.sep}`));
  const chars = new Set(BASE);
  for (const f of files) {
    const raw = fs
      .readFileSync(f, 'utf8')
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    for (const ch of raw) chars.add(ch);
  }
  text = [...chars].join('');
}

// Which characters does Hahmlet cover? The rest go to the fallback face.
const hb = fs.readFileSync(HAHMLET);
const font = opentype.parse(hb.buffer.slice(hb.byteOffset, hb.byteOffset + hb.byteLength));
const has = (ch) => font.charToGlyphIndex(ch) > 0;
const chars = [...new Set(text)].filter((ch) => ch.codePointAt(0) >= 0x20);
const main = chars.filter(has).join('');
const rest = chars.filter((ch) => !has(ch) && !/\s/.test(ch)).join('');

fs.mkdirSync(outDir, { recursive: true });
const sizes = [];
for (const w of [200, 400]) {
  const a = await subsetFont(hb, main, { targetFormat: 'woff2', variationAxes: { wght: w } });
  fs.writeFileSync(path.join(outDir, `goll-${w}.woff2`), a);
  sizes.push(`goll-${w}.woff2 ${(a.length / 1024).toFixed(1)} KB`);
}
const b = await subsetFont(fs.readFileSync(NOTO), rest || '空', { targetFormat: 'woff2' });
fs.writeFileSync(path.join(outDir, 'fallback.woff2'), b);
console.log(`fonts: ${sizes.join(', ')} (${main.length} chars), fallback.woff2 ${(b.length / 1024).toFixed(1)} KB (${rest.length} chars: ${rest.slice(0, 40)}${rest.length > 40 ? '…' : ''}) → ${outDir}`);
