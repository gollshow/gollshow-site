#!/usr/bin/env node
/**
 * Turn saved Adobe Portfolio pages (gollshow.com) into site content.
 *
 *   node scripts/import/from-pages.mjs <dir-with-html> [--dry]
 *
 * Understands Adobe Portfolio markup:
 *   - gallery pages  (.project-cover tiles → title, date, cover, link)
 *   - project pages  (.page-header title/description, image modules with the
 *                     original in .js-lightbox[data-src], text and embed modules)
 * For every work it downloads the LARGEST image available from
 * cdn.myportfolio.com (original → largest srcset entry), writes
 * src/assets/media/<slug>-NN.<ext> and src/content/works/<slug>.md, and keeps
 * titles / years / captions exactly as written. Existing works are never
 * overwritten. Anything mentioning 「귀행자」 is skipped (owner request).
 * Writes _import/last-run.md with what was created and what was missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

const SRC = process.argv[2] || '_import/inbox';
const DRY = process.argv.includes('--dry');
const EXCLUDE = ['귀행자'];
const WORKS = 'src/content/works';
const MEDIA = 'src/assets/media';
const UA = 'gollshow-site-importer/1.0 (+https://github.com/gollshow/gollshow-site)';

// old gallery slug → room
const ROOM = { picture: 'painting', ttt: 'painting', contepastel: 'conte-pastel', digital: 'digital', 'music-1': 'music', music: 'music' };

const log = [];
const note = (s) => (log.push(s), console.log(s));

const pages = fs
  .readdirSync(SRC, { withFileTypes: true })
  .filter((e) => e.isFile() && /\.html?$/i.test(e.name))
  .map((e) => path.join(SRC, e.name));

const clean = (t) => t.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const textOf = ($, el) => {
  const c = $(el).clone();
  c.find('br').replaceWith('\n');
  c.find('p, div, li').each((_, x) => $(x).append('\n'));
  return clean(c.text());
};
const slugOf = (href) => {
  try {
    return new URL(href, 'https://gollshow.com/').pathname.replace(/^\/+|\/+$/g, '');
  } catch {
    return '';
  }
};
const fileSlug = (s) =>
  s
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'work';

/** All candidate URLs for an <img>, biggest first. */
function candidates($, img) {
  const out = [];
  const lb = $(img).closest('.js-lightbox').attr('data-src');
  if (lb) out.push(lb);
  for (const attr of ['data-srcset', 'srcset']) {
    const v = $(img).attr(attr);
    if (!v) continue;
    v.split(',')
      .map((s) => s.trim().split(/\s+/))
      .filter(([u]) => u)
      .sort((a, b) => parseInt(b[1] || '0') - parseInt(a[1] || '0'))
      .forEach(([u]) => out.push(u));
  }
  for (const attr of ['data-src', 'src']) {
    const v = $(img).attr(attr);
    if (v && !v.startsWith('data:')) out.push(v);
  }
  return [...new Set(out.map((u) => u.replace(/&amp;/g, '&')).filter((u) => /myportfolio\.com|^https?:/.test(u)))];
}

async function download(urls, base) {
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'user-agent': UA } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if (!meta.width) continue;
      const big = Math.max(meta.width, meta.height) > 4096;
      const ext = meta.format === 'png' ? 'png' : 'jpg';
      const file = `${base}.${ext}`;
      if (!DRY) {
        let img = sharp(buf).rotate();
        if (big) img = img.resize(4096, 4096, { fit: 'inside' });
        await (ext === 'png' ? img.png() : img.jpeg({ quality: 92, mozjpeg: true })).toFile(path.join(MEDIA, file));
      }
      return { file, from: u, w: meta.width, h: meta.height };
    } catch {}
  }
  return null;
}

const gallery = new Map(); // project slug → { room, title, year, cover[] }
const projects = [];
const loose = []; // image modules on non-project pages (e.g. a page of paintings)

for (const file of pages) {
  let html = fs.readFileSync(file, 'utf8');
  const $ = cheerio.load(html);
  $('a').each((_, a) => {
    if (EXCLUDE.some((m) => $(a).text().includes(m) || ($(a).attr('title') || '').includes(m))) $(a).remove();
  });
  if (EXCLUDE.some((m) => $('body').text().includes(m) || $('title').text().includes(m))) {
    note(`- skipped \`${path.basename(file)}\` (excluded by owner request)`);
    continue;
  }
  const canonical = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content') || '';
  const pageSlug = slugOf(canonical) || path.basename(file).replace(/\.html?$/i, '');
  if (['', 'home', 'index', 'work'].includes(pageSlug)) {
    note(`- \`${path.basename(file)}\`: landing / overview page — nothing to import (its image is already the site's opening image)`);
    continue;
  }
  const activeNav = $('nav a.active, .gallery-title a.active, .page-title a.active, a[aria-current]')
    .map((_, a) => slugOf($(a).attr('href') || ''))
    .get()
    .find((s) => ROOM[s]);

  const covers = $('.project-cover');
  if (covers.length) {
    const room = ROOM[pageSlug] || ROOM[activeNav] || 'etc';
    covers.each((_, c) => {
      const href = $(c).is('a') ? $(c).attr('href') : $(c).find('a').first().attr('href');
      const s = slugOf(href || '');
      const title = clean($(c).find('.title').first().text());
      const year = clean($(c).find('.date').first().text());
      const img = $(c).find('img').first();
      gallery.set(s || title, { room, title, year, cover: img.length ? candidates($, img) : [] });
    });
    note(`- gallery \`${pageSlug}\` → ${covers.length} works (room: ${room})`);
    continue;
  }

  const modules = $('.project-module');
  const header = $('.page-header, .project-header').first();
  const title = clean(header.find('.title').first().text() || $('h1').first().text());
  const images = [];
  const texts = [];
  const embeds = [];
  modules.each((_, m) => {
    const $m = $(m);
    if ($m.hasClass('project-module-text')) {
      const t = textOf($, $m.find('.rich-text').length ? $m.find('.rich-text') : $m);
      if (t) texts.push(t);
    } else if ($m.hasClass('project-module-embed') || $m.find('iframe').length) {
      $m.find('iframe').each((_, f) => {
        const u = $(f).attr('src') || $(f).attr('data-src');
        if (u) embeds.push(u.startsWith('//') ? 'https:' + u : u);
      });
    }
    $m.find('img').each((_, img) => {
      const c = candidates($, img);
      if (c.length) images.push({ urls: c, caption: clean($(img).closest('.project-module').find('.caption, figcaption').first().text()) || undefined });
    });
  });
  if (!images.length && !embeds.length) {
    note(`- \`${pageSlug}\`: no works found on this page`);
    continue;
  }
  const isProject = !!header.length && !!title && title.toLowerCase() !== ($('meta[property="og:site_name"]').attr('content') || '').toLowerCase();
  if (isProject) {
    projects.push({
      slug: pageSlug,
      title,
      description: [clean(header.find('.description').first().text()), ...texts].filter(Boolean).join('\n\n') || undefined,
      year: clean(header.find('.date').first().text()) || undefined,
      room: ROOM[activeNav],
      images,
      embeds,
    });
  } else {
    for (const im of images) loose.push({ ...im, page: pageSlug, room: ROOM[pageSlug] || ROOM[activeNav] || 'etc' });
    note(`- \`${pageSlug}\`: ${images.length} images on a page without project titles → imported as hidden drafts`);
  }
}

if (!DRY) fs.mkdirSync(MEDIA, { recursive: true });
const existing = new Set(fs.readdirSync(WORKS).map((f) => f.replace(/\.md$/, '')));
const created = [];
const q = (s) => JSON.stringify(s);
let order = 100;

async function writeWork({ slug, title, room, year, description, images, embeds = [], draft = false }) {
  const base = fileSlug(slug || title);
  if (existing.has(base)) {
    note(`- \`${base}\` already exists — left untouched`);
    return;
  }
  const files = [];
  for (const [i, im] of images.entries()) {
    const got = await download(im.urls, `${base}-${String(i + 1).padStart(2, '0')}`);
    if (got) files.push({ ...got, caption: im.caption });
    else note(`  - ✗ ${base}: image ${i + 1} could not be downloaded (${im.urls[0]})`);
  }
  const link = embeds.find((e) => /soundcloud|youtube|youtu\.be|vimeo/.test(e));
  const fm = [
    '---',
    `title: ${q(title || base)}`,
    `category: ${room || 'etc'}`,
    year ? `year: ${q(year)}` : null,
    files.length ? 'images:' : 'images: []',
    ...files.flatMap((f) => [`  - image: ${q('/src/assets/media/' + f.file)}`, ...(f.caption ? [`    caption: ${q(f.caption)}`] : [])]),
    description ? `description: ${q(description)}` : null,
    link ? `link: ${q(link)}` : null,
    `order: ${order++}`,
    draft ? 'draft: true' : null,
    `# imported from gollshow.com/${slug} on ${new Date().toISOString().slice(0, 10)}`,
    '---',
    '',
  ]
    .filter((l) => l !== null)
    .join('\n');
  if (!DRY) fs.writeFileSync(path.join(WORKS, base + '.md'), fm);
  existing.add(base);
  created.push({ base, title, room, images: files.length, draft });
}

for (const p of projects) {
  const g = gallery.get(p.slug);
  await writeWork({ ...p, title: p.title || g?.title, room: p.room || g?.room, year: p.year || g?.year });
  gallery.delete(p.slug);
}
// gallery tiles whose project page was not saved: cover only
for (const [s, g] of gallery) {
  if (!g.cover.length) continue;
  await writeWork({ slug: s, title: g.title, room: g.room, year: g.year || undefined, images: [{ urls: g.cover }] });
  note(`  - ${g.title || s}: only the gallery cover was available (save the project page to get every image)`);
}
for (const [i, l] of loose.entries()) {
  await writeWork({ slug: `${l.page}-${i + 1}`, title: l.caption || `${l.page} ${i + 1}`, room: l.room, images: [l], draft: true });
}

const report = [
  `# Import run — ${new Date().toISOString()}`,
  '',
  `Pages read: ${pages.length}. Works created: ${created.length}.`,
  '',
  ...created.map((c) => `- ${c.draft ? '(hidden draft) ' : ''}**${c.title}** → \`${c.room}\`, ${c.images} image(s) — \`src/content/works/${c.base}.md\``),
  '',
  '## Notes',
  ...log,
  '',
].join('\n');
if (!DRY) {
  fs.mkdirSync('_import', { recursive: true });
  fs.writeFileSync('_import/last-run.md', report);
}
console.log(report);
