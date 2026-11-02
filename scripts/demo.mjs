#!/usr/bin/env node
/**
 * QA-only demo content (git-ignored): abstract placeholder images in varied
 * aspect ratios + clearly labelled demo works, to review layouts before the
 * real works are uploaded.   node scripts/demo.mjs [--clean]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WORKS = 'src/content/works';
const MEDIA = 'src/assets/media/_demo';
const AUDIO = 'public/media/audio';

if (process.argv.includes('--clean')) {
  for (const f of fs.readdirSync(WORKS)) if (f.startsWith('_demo-')) fs.rmSync(path.join(WORKS, f));
  fs.rmSync(MEDIA, { recursive: true, force: true });
  for (const f of fs.existsSync(AUDIO) ? fs.readdirSync(AUDIO) : []) if (f.startsWith('_demo')) fs.rmSync(path.join(AUDIO, f));
  console.log('demo content removed');
  process.exit(0);
}

fs.mkdirSync(MEDIA, { recursive: true });
fs.mkdirSync(AUDIO, { recursive: true });

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const PALETTES = [
  ['#e9e1d3', '#c46a4a', '#2f3b52', '#d9b26f'],
  ['#efe9de', '#6f8f7a', '#1f2a2c', '#c9a77c'],
  ['#f1ece4', '#3d5a80', '#ee6c4d', '#293241'],
  ['#ebe4d8', '#8c5e58', '#d4b483', '#4a4e69'],
  ['#e8e6df', '#264653', '#e9c46a', '#e76f51'],
  ['#f2efe9', '#5c6b73', '#9db4c0', '#253237'],
];

function svgArt(w, h, pal) {
  const [bg, ...cs] = pal;
  let shapes = '';
  const n = 5 + Math.floor(rnd() * 6);
  for (let i = 0; i < n; i++) {
    const c = cs[i % cs.length];
    const x = rnd() * w;
    const y = rnd() * h;
    const r = (0.08 + rnd() * 0.32) * Math.min(w, h);
    const o = 0.35 + rnd() * 0.5;
    if (rnd() > 0.45) shapes += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * (0.5 + rnd())}" fill="${c}" opacity="${o}" filter="url(#soft)"/>`;
    else {
      const x2 = x + (rnd() - 0.5) * w;
      const y2 = y + (rnd() - 0.5) * h;
      shapes += `<path d="M${x} ${y} Q ${(x + x2) / 2 + (rnd() - 0.5) * w * 0.4} ${(y + y2) / 2 + (rnd() - 0.5) * h * 0.4} ${x2} ${y2}" stroke="${c}" stroke-width="${r * 0.35}" stroke-linecap="round" fill="none" opacity="${o}" filter="url(#brush)"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="soft"><feGaussianBlur stdDeviation="${Math.min(w, h) * 0.02}"/></filter>
    <filter id="brush"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="${Math.floor(rnd() * 99)}"/><feDisplacementMap in="SourceGraphic" scale="${Math.min(w, h) * 0.05}"/><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  ${shapes}
  <rect width="100%" height="100%" filter="url(#paper)"/>
</svg>`;
}

const ratios = [
  [2400, 3000], [3200, 2200], [2400, 2400], [2000, 2900], [3000, 2000], [2200, 3100],
  [2600, 2600], [3400, 2100], [2100, 2800], [2800, 3500], [3000, 2400], [1800, 2600],
];
const cats = ['painting', 'painting', 'painting', 'painting', 'painting', 'painting', 'painting', 'conte-pastel', 'conte-pastel', 'conte-pastel', 'digital', 'digital'];
const media = ['캔버스에 유채', '캔버스에 유채', '종이에 수채', '캔버스에 아크릴', '종이에 콩테', '종이에 파스텔', '디지털 페인팅'];
const mediaEn = ['Oil on canvas', 'Oil on canvas', 'Watercolour on paper', 'Acrylic on canvas', 'Conté on paper', 'Pastel on paper', 'Digital painting'];

for (let i = 0; i < ratios.length; i++) {
  const [w, h] = ratios[i];
  const file = `demo-${String(i + 1).padStart(2, '0')}.jpg`;
  await sharp(Buffer.from(svgArt(w, h, PALETTES[i % PALETTES.length]))).jpeg({ quality: 86 }).toFile(path.join(MEDIA, file));
  const extra = i === 0 ? [`demo-detail-a.jpg`, `demo-detail-b.jpg`] : [];
  for (const [j, x] of extra.entries()) await sharp(Buffer.from(svgArt(j ? 2800 : 2400, j ? 2000 : 3000, PALETTES[(i + j + 2) % PALETTES.length]))).jpeg({ quality: 86 }).toFile(path.join(MEDIA, x));
  const mi = i % media.length;
  const md = `---
title: 데모 작품 ${String(i + 1).padStart(2, '0')}
title_en: Demo work ${String(i + 1).padStart(2, '0')}
year: "${2014 + (i % 11)}"
category: ${cats[i]}
medium: ${media[mi]}
medium_en: ${mediaEn[mi]}
size: ${[53, 72.7, 90.9, 116.8][i % 4]} × ${[45.5, 60.6, 72.7, 91][i % 4]} cm
images:
  - image: /src/assets/media/_demo/${file}
${extra.map((x, j) => `  - image: /src/assets/media/_demo/${x}\n    caption: 부분 ${j + 1}\n    caption_en: Detail ${j + 1}`).join('\n')}
description: ${i % 3 === 0 ? '"QA용 데모 작품입니다. 실제 작품이 아닙니다.\\n\\n두 번째 문단 — 레이아웃 확인용 텍스트."' : '""'}
description_en: ${i % 3 === 0 ? '"Demo work for layout QA — not a real work."' : '""'}
featured: ${i < 4}
order: ${i + 1}
---
`;
  fs.writeFileSync(path.join(WORKS, `_demo-${String(i + 1).padStart(2, '0')}.md`), md);
}

// two demo tracks: a generated tone (WAV) and an external link
const sr = 22050;
const secs = 20;
const pcm = Buffer.alloc(sr * secs * 2);
for (let i = 0; i < sr * secs; i++) {
  const t = i / sr;
  const env = Math.min(1, t * 2) * Math.min(1, (secs - t) * 2);
  const v = 0.18 * env * (Math.sin(2 * Math.PI * 220 * t) * 0.6 + Math.sin(2 * Math.PI * 330 * t) * 0.3 + Math.sin(2 * Math.PI * 440 * t * (1 + 0.002 * Math.sin(t))) * 0.1);
  pcm.writeInt16LE(Math.round(v * 32767), i * 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22); hdr.writeUInt32LE(sr, 24);
hdr.writeUInt32LE(sr * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(path.join(AUDIO, '_demo-tone.wav'), Buffer.concat([hdr, pcm]));
fs.writeFileSync(path.join(WORKS, '_demo-m1.md'), `---\ntitle: 데모 음악 01\ntitle_en: Demo piece 01\nyear: "2021"\ncategory: music\nmedium: 피아노\nmedium_en: Piano\naudio: /media/audio/_demo-tone.wav\norder: 1\n---\n`);
fs.writeFileSync(path.join(WORKS, '_demo-m2.md'), `---\ntitle: 데모 음악 02 (외부 링크)\ntitle_en: Demo piece 02 (external link)\nyear: "2019"\ncategory: music\nmedium: 영화음악\nmedium_en: Film score\nlink: https://soundcloud.com/example/demo\norder: 2\n---\n`);
console.log('demo content written');
