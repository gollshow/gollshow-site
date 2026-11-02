#!/usr/bin/env node
/**
 * Self-hosted, subset web fonts (both SIL OFL 1.1):
 *   Noto Serif KR 300/400  → serif-300.woff2, serif-400.woff2
 *   Pretendard    400/500  → sans-400.woff2,  sans-500.woff2
 *
 *   node scripts/fonts.mjs dist     after `astro build`: subset to exactly the
 *                                   characters used in dist/**.html|js
 *   node scripts/fonts.mjs --dev    for `astro dev`: common Korean (KS X 1001)
 *                                   + Latin into public/fonts (git-ignored)
 */
import fs from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';

const FACES = [
  { out: 'serif-300', src: 'node_modules/@expo-google-fonts/noto-serif-kr/300Light/NotoSerifKR_300Light.ttf' },
  { out: 'serif-400', src: 'node_modules/@expo-google-fonts/noto-serif-kr/400Regular/NotoSerifKR_400Regular.ttf' },
  { out: 'sans-400', src: 'node_modules/pretendard/dist/public/static/Pretendard-Regular.otf' },
  { out: 'sans-500', src: 'node_modules/pretendard/dist/public/static/Pretendard-Medium.otf' },
];

// Always include: printable ASCII, Latin-1, typographic punctuation, arrows used in UI.
const BASE = (() => {
  let s = '';
  for (let c = 0x20; c < 0x7f; c++) s += String.fromCharCode(c);
  for (let c = 0xa0; c <= 0xff; c++) s += String.fromCharCode(c);
  return s + '‘’“”–—…·•→←↗⤢×−①②③空「」『』〈〉《》、。·';
})();

function ksx1001() {
  // The 2,350 modern Hangul syllables of KS X 1001 via EUC-KR decoding.
  const dec = new TextDecoder('euc-kr');
  let s = '';
  for (let hi = 0xb0; hi <= 0xc8; hi++)
    for (let lo = 0xa1; lo <= 0xfe; lo++) s += dec.decode(new Uint8Array([hi, lo]));
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
  if (FACES.every((f) => fs.existsSync(path.join(outDir, f.out + '.woff2')))) {
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
    const raw = fs.readFileSync(f, 'utf8')
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    for (const ch of raw) chars.add(ch);
  }
  text = [...chars].join('');
}

fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const f of FACES) {
  const buf = fs.readFileSync(f.src);
  const woff2 = await subsetFont(buf, text, { targetFormat: 'woff2' });
  fs.writeFileSync(path.join(outDir, f.out + '.woff2'), woff2);
  total += woff2.length;
  console.log(`fonts: ${f.out}.woff2 ${(woff2.length / 1024).toFixed(1)} KB`);
}
console.log(`fonts: ${[...new Set(text)].length} glyphs requested, ${(total / 1024).toFixed(0)} KB total → ${outDir}`);
