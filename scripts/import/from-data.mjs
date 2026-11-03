#!/usr/bin/env node
/**
 * One-off import of the old site (gollshow.com on Adobe Portfolio) from a
 * plain data file the owner fetched on their own PC (see _import/adobe-*.txt).
 *
 *   node scripts/import/from-data.mjs _import/adobe-2026-11-03.txt [--dry]
 *
 * - Downloads every image exactly as listed (the URL with its ?h= hash) from
 *   cdn.myportfolio.com, checks the pixel size against the data, and keeps the
 *   file byte for byte (no re-encoding, no upscaling).
 * - One public work per grid image, in grid order. No titles or years are
 *   invented: grid works have no `title` at all.
 * - The three projects keep their text exactly as written (split into size +
 *   medium, which the site joins back with one space).
 * - Writes the music page (name + platform links) and the about page.
 * - Never overwrites an existing file. Writes _import/round2-report.md.
 *
 * The cloud session that wrote this could not reach the CDN, so it runs on a
 * GitHub Actions runner (.github/workflows/import-round2.yml).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = process.argv[2] || '_import/adobe-2026-11-03.txt';
const DRY = process.argv.includes('--dry');
const NOFETCH = process.argv.includes('--no-fetch'); // parse check only
const WORKS = 'src/content/works';
const PAGES = 'src/content/pages';
const MEDIA = 'src/assets/media';
const UA = 'gollshow-site-importer/2.0 (+https://github.com/gollshow/gollshow-site)';
const today = new Date().toISOString().slice(0, 10);

const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split('\n');
const cdn = lines.find((l) => l.startsWith('cdn: '))?.slice(5).trim();
if (!cdn) throw new Error('no "cdn:" line in ' + SRC);

// ── parse ────────────────────────────────────────────────────────────────
const rooms = []; // { key, page, title, images: [{ref, w, h}] }
const projects = [];
const music = { text: undefined, buttons: [] };
const about = [];
let section = null;
const IMG = /^(\S+\?h=[0-9a-f]+)\s+(\d+)x(\d+)$/;
for (const l of lines) {
  const s = l.trim();
  if (!s || s.startsWith('#') && !s.startsWith('## ')) continue;
  if (s.startsWith('## ')) {
    const m = s.match(/^## room (\S+) \(old page (\S+), page title "([^"]+)"/);
    if (m) rooms.push((section = { kind: 'room', key: m[1], page: m[2], title: m[3], images: [] }));
    else if (s.startsWith('## projects')) section = { kind: 'projects' };
    else if (s.startsWith('## music')) section = { kind: 'music' };
    else if (s.startsWith('## about')) section = { kind: 'about' };
    else section = null;
    continue;
  }
  if (!section) continue;
  if (section.kind === 'room') {
    const m = s.match(IMG);
    if (m) section.images.push({ ref: m[1], w: +m[2], h: +m[3] });
  } else if (section.kind === 'projects' && s.startsWith('- ')) {
    const f = Object.fromEntries(
      s.slice(2).split(' | ').map((p) => {
        if (p.startsWith('old page ')) return ['old page', p.slice(9).trim()];
        const i = p.indexOf(': ');
        return [p.slice(0, i).trim(), p.slice(i + 2).trim()];
      }),
    );
    const img = (v) => (v && v !== '-' ? v.split(/\s*,\s*/).map((x) => x.match(IMG)).filter(Boolean).map((m) => ({ ref: m[1], w: +m[2], h: +m[3] })) : []);
    projects.push({
      title: JSON.parse(f.title),
      page: f['old page'],
      text: JSON.parse(f.text),
      cover: img(f.cover)[0],
      images: img(f.images),
      video: f['video embed'],
    });
  } else if (section.kind === 'music') {
    let m;
    if ((m = s.match(/^text: (".*")$/))) music.text = JSON.parse(m[1]);
    else if ((m = s.match(/^button: (".*?") -> (\S+)$/))) music.buttons.push({ label: JSON.parse(m[1]), url: m[2] });
  } else if (section.kind === 'about') {
    let m;
    if ((m = s.match(/^image: (.+)$/))) about.push({ type: 'image', ...img1(m[1]) });
    else if ((m = s.match(/^text: (".*")$/))) about.push({ type: 'text', text: JSON.parse(m[1]) });
    else if ((m = s.match(/^video embed: (\S+)$/))) about.push({ type: 'video', url: m[1] });
  }
}
function img1(v) {
  const m = v.trim().match(IMG);
  return m ? { ref: m[1], w: +m[2], h: +m[3] } : {};
}

// ── download ─────────────────────────────────────────────────────────────
const report = [];
const failures = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchImage(ref, expect, base, dir) {
  const url = cdn + ref;
  const ext = (ref.split('?')[0].match(/\.(\w+)$/)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const rel = path.join(dir, `${base}.${ext}`);
  const out = path.join(MEDIA, rel);
  const row = { base, url, expect: `${expect.w}x${expect.h}` };
  if (fs.existsSync(out)) {
    const m = await sharp(out).metadata();
    Object.assign(row, { status: 'kept (already here)', got: `${m.width}x${m.height}`, bytes: fs.statSync(out).size });
    report.push(row);
    return '/' + path.posix.join('src/assets/media', dir, `${base}.${ext}`);
  }
  let lastErr = '';
  if (NOFETCH) {
    Object.assign(row, { status: 'not fetched (--no-fetch)' });
    report.push(row);
    return undefined;
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        if (res.status === 404 || res.status === 403) break;
      } else {
        const buf = Buffer.from(await res.arrayBuffer());
        const m = await sharp(buf).metadata();
        const got = `${m.width}x${m.height}`;
        if (m.width !== expect.w || m.height !== expect.h) {
          // a different size is not a guess we keep: report it and leave the work without this image
          Object.assign(row, { status: `size mismatch (got ${got})`, got, bytes: buf.length });
          report.push(row);
          failures.push(row);
          return undefined;
        }
        if (!DRY) {
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, buf);
        }
        Object.assign(row, { status: 'ok', got, bytes: buf.length, format: m.format });
        report.push(row);
        return '/' + path.posix.join('src/assets/media', dir, `${base}.${ext}`);
      }
    } catch (e) {
      lastErr = String(e?.message || e);
    }
    await sleep(1000 * 2 ** attempt);
  }
  Object.assign(row, { status: `failed (${lastErr})` });
  report.push(row);
  failures.push(row);
  return undefined;
}

const q = (s) => JSON.stringify(s);
const pad3 = (n) => String(n).padStart(3, '0');
const created = [];
const skipped = [];
function writeFile(file, body) {
  if (fs.existsSync(file)) {
    skipped.push(file);
    return;
  }
  if (!DRY) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
  created.push(file);
}

// grid works: one public work per image, in grid order, no title
for (const room of rooms) {
  for (const [i, im] of room.images.entries()) {
    const n = i + 1;
    const base = `${room.key}-${pad3(n)}`;
    const file = await fetchImage(im.ref, im, base, room.key);
    const fm = [
      '---',
      `category: ${room.key}`,
      file ? 'images:' : 'images: []',
      file ? `  - image: ${q(file)}` : null,
      `order: ${100 + n}`,
      `# gollshow.com${room.page} ("${room.title}"), grid position ${n}; imported ${today}. No title on the old site.`,
      '---',
      '',
    ].filter((l) => l !== null);
    writeFile(path.join(WORKS, `${base}.md`), fm.join('\n'));
  }
}

// projects (painting room, ahead of the grid works)
const slugOf = (t) => t.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
for (const [i, p] of projects.entries()) {
  const slug = slugOf(p.title);
  const cover = p.cover ? await fetchImage(p.cover.ref, p.cover, `${slug}-cover`, 'painting') : undefined;
  const imgs = [];
  for (const [k, im] of p.images.entries()) {
    const f = await fetchImage(im.ref, im, `${slug}-${String(k + 1).padStart(2, '0')}`, 'painting');
    if (f) imgs.push(f);
  }
  // "1200x870mm Oil" → size "1200x870mm" + medium "Oil" (shown joined with one space, i.e. exactly as written)
  const m = p.text.match(/^(\S+)\s+(.+)$/);
  const fm = [
    '---',
    `title: ${q(p.title)}`,
    'category: painting',
    'year: "2024"',
    m ? `size: ${q(m[1])}` : null,
    m ? `medium: ${q(m[2])}` : `medium: ${q(p.text)}`,
    imgs.length ? 'images:' : 'images: []',
    ...imgs.map((f) => `  - image: ${q(f)}`),
    cover ? `cover: ${q(cover)}` : null,
    p.video ? `video: ${q(p.video)}` : null,
    `order: ${i + 1}`,
    `# gollshow.com${p.page}; text on the old page: ${q(p.text)}; year from its cover; imported ${today}.`,
    '---',
    '',
  ].filter((l) => l !== null);
  writeFile(path.join(WORKS, `${slug}.md`), fm.join('\n'));
}

// music page
{
  // The data writes the YouTube handle with a full-width "＠" (U+FF20); YouTube
  // handles use the ASCII "@", so the link is stored with "@".
  const links = music.buttons.map((b) => ({ ...b, url: b.url.replace('＠', '@') }));
  const fm = [
    '---',
    'title: 음악',
    'title_en: Music',
    `name: ${q(music.text)}`,
    'links:',
    ...links.flatMap((l) => [`  - label: ${q(l.label)}`, `    url: ${q(l.url)}`]),
    `# gollshow.com/music-1 ("Music"); imported ${today}`,
    '---',
    '',
  ];
  const file = path.join(PAGES, 'music.md');
  if (!DRY) {
    fs.mkdirSync(PAGES, { recursive: true });
    fs.writeFileSync(file, fm.join('\n'));
  }
  created.push(file + ' (written)');
}

// about page: photo, text, video, caption — in that order on the old page
{
  const img = about.find((a) => a.type === 'image');
  const portrait = img ? await fetchImage(img.ref, img, 'about-portrait', 'about') : undefined;
  const texts = about.filter((a) => a.type === 'text').map((a) => a.text);
  const video = about.find((a) => a.type === 'video')?.url;
  const vIdx = about.findIndex((a) => a.type === 'video');
  const caption = about.slice(vIdx + 1).find((a) => a.type === 'text')?.text;
  const bio = texts.find((t) => t !== caption);
  const fm = [
    '---',
    'title: 소개',
    'title_en: About',
    `bio: ${q(bio)}`,
    portrait ? `portrait: ${q(portrait)}` : 'portrait: ""',
    video ? `video: ${q(video)}` : null,
    caption ? `video_caption: ${q(caption)}` : null,
    'cv: []',
    `# gollshow.com/test ("About"); imported ${today}`,
    '---',
    '',
  ].filter((l) => l !== null);
  const file = path.join(PAGES, 'about.md');
  if (!DRY) fs.writeFileSync(file, fm.join('\n'));
  created.push(file + ' (written)');
}

// ── report ───────────────────────────────────────────────────────────────
const ok = report.filter((r) => r.status === 'ok' || r.status.startsWith('kept')).length;
const md = [
  `# Import run (data file) — ${new Date().toISOString()}`,
  '',
  `Source: \`${SRC}\`. Images listed: ${report.length}. Downloaded and size-checked: **${ok}**. Failed: **${failures.length}**.`,
  '',
  failures.length ? '## Failures (not replaced, nothing guessed)' : '## Failures\n\nNone.',
  ...failures.map((f) => `- \`${f.base}\`: ${f.status} — expected ${f.expect} — ${f.url}`),
  '',
  '## Every image',
  '',
  '| file | expected | got | bytes | status |',
  '|---|---|---|---|---|',
  ...report.map((r) => `| ${r.base} | ${r.expect} | ${r.got ?? '—'} | ${r.bytes ?? '—'} | ${r.status} |`),
  '',
  `## Files written (${created.length})`,
  '',
  ...created.map((c) => `- ${c}`),
  skipped.length ? `\n## Left untouched (already existed): ${skipped.length}\n\n${skipped.map((s) => `- ${s}`).join('\n')}` : '',
  '',
].join('\n');
if (!DRY) fs.writeFileSync('_import/round2-report.md', md);
console.log(md.split('## Every image')[0]);
if (failures.length) process.exitCode = 0; // failures are reported, not fatal
