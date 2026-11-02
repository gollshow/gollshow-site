#!/usr/bin/env node
/**
 * Snapshot crawler for the old Adobe Portfolio site (gollshow.com).
 *
 * Runs on a GitHub Actions runner (open internet). It:
 *   1. crawls every same-host page reachable from the known entry points,
 *   2. saves the raw HTML of each page,
 *   3. collects every cdn.myportfolio.com asset and downloads the LARGEST
 *      variant it can get (original > _rw_3840 > ... > largest srcset entry),
 *   4. records embeds (SoundCloud / YouTube / Vimeo / Bandcamp …),
 *   5. writes everything + manifest.json to OUT_DIR.
 *
 * Pages that mention 「귀행자」 are skipped entirely (not saved, not followed,
 * assets not downloaded) by owner request.
 *
 * Usage: node scripts/import/crawl.mjs <outDir>
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || '_import');
const HOSTS = new Set(['gollshow.com', 'www.gollshow.com']);
const ENTRY = [
  'https://gollshow.com/',
  'https://gollshow.com/work',
  'https://gollshow.com/music-1',
  'https://gollshow.com/picture',
  'https://gollshow.com/ttt',
  'https://gollshow.com/contepastel',
  'https://gollshow.com/digital',
  'https://gollshow.com/test',
  'https://gollshow.com/sitemap.xml',
];
const EXCLUDE_MARKERS = ['귀행자'];
const MAX_PAGES = 400;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { binary = false, tries = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: binary ? 'image/*,*/*' : 'text/html,*/*' }, redirect: 'follow' });
      if (!res.ok) return { ok: false, status: res.status, url: res.url };
      const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
      return { ok: true, status: res.status, url: res.url, type: res.headers.get('content-type') || '', body };
    } catch (e) {
      lastErr = e;
      await sleep(800 * (i + 1));
    }
  }
  return { ok: false, status: 0, error: String(lastErr) };
}

function slugFor(u) {
  const p = new URL(u).pathname.replace(/^\/+|\/+$/g, '');
  return (p || 'index').replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function normPage(href, base) {
  try {
    const u = new URL(href, base);
    if (!HOSTS.has(u.hostname)) return null;
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hostname = 'gollshow.com';
    u.protocol = 'https:';
    u.hash = '';
    u.search = '';
    if (/\.(jpe?g|png|gif|webp|svg|css|js|ico|pdf|mp3|mp4|xml)$/i.test(u.pathname) && !u.pathname.endsWith('sitemap.xml')) return null;
    return u.toString().replace(/\/$/, '') || 'https://gollshow.com/';
  } catch {
    return null;
  }
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x2F;/g, '/').replace(/\\\//g, '/');

function extractLinks(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const n = normPage(decode(m[1]), base);
    if (n) out.add(n);
  }
  for (const m of html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    const n = normPage(decode(m[1]), base);
    if (n) out.add(n);
  }
  return [...out];
}

function extractAssets(html) {
  const out = new Set();
  for (const m of decode(html).matchAll(/https?:\/\/cdn\.myportfolio\.com\/[^"'\s)<>,]+/g)) out.add(m[0]);
  return [...out];
}

function extractEmbeds(html) {
  const out = new Set();
  const re = /(?:src|data-src|href)\s*=\s*["']((?:https?:)?\/\/(?:[a-z0-9-]+\.)*(?:soundcloud\.com|youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|bandcamp\.com|spotify\.com|music\.apple\.com|instagram\.com)[^"']*)["']/gi;
  for (const m of decode(html).matchAll(re)) out.add(m[1].startsWith('//') ? 'https:' + m[1] : m[1]);
  return [...out];
}

/** Split a myportfolio URL into { key, variant, ext, url } */
function parseAsset(url) {
  const u = new URL(url);
  const file = u.pathname.split('/').pop();
  const ext = (file.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
  const stem = file.replace(/\.[a-z0-9]+$/i, '');
  const m = stem.match(/^(.*?)(_(?:rw|carw|rwc)_[0-9x]+)?$/i);
  const baseStem = m ? m[1] : stem;
  const variant = m && m[2] ? m[2].slice(1) : 'original';
  const dir = u.pathname.split('/').slice(0, -1).join('/');
  return { key: `${dir}/${baseStem}`, variant, ext, url, dir, baseStem, hash: u.searchParams.get('h') };
}

function variantWidth(v) {
  if (v === 'original') return Infinity;
  const nums = v.match(/[0-9]+/g) || ['0'];
  return Math.max(...nums.map(Number));
}

async function main() {
  await fs.mkdir(path.join(OUT, 'raw'), { recursive: true });
  await fs.mkdir(path.join(OUT, 'images'), { recursive: true });

  const queue = [...ENTRY];
  const seen = new Set();
  const pages = [];
  const skipped = [];
  const assetRefs = new Map(); // url -> [pageSlug]
  const embeds = new Map();
  const errors = [];
  const excludedLinks = new Set();

  while (queue.length && pages.length + skipped.length < MAX_PAGES) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const res = await get(url);
    if (!res.ok) {
      errors.push({ url, status: res.status, error: res.error });
      continue;
    }
    let html = res.body;
    // Drop any <a>…</a> (nav item, project cover tile …) that mentions an
    // excluded title, and never follow where it points.
    html = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (a) => {
      if (!EXCLUDE_MARKERS.some((mk) => a.includes(mk))) return a;
      const h = a.match(/href\s*=\s*["']([^"']+)["']/i);
      const n = h && normPage(decode(h[1]), res.url || url);
      if (n) excludedLinks.add(n);
      return '';
    });
    if (excludedLinks.has(url) || EXCLUDE_MARKERS.some((mk) => html.includes(mk))) {
      skipped.push({ url, reason: 'excluded-by-owner-request' });
      continue;
    }
    const slug = slugFor(url);
    await fs.writeFile(path.join(OUT, 'raw', slug + (url.endsWith('.xml') ? '' : '.html')), html);
    const links = extractLinks(html, res.url || url);
    const assets = extractAssets(html);
    const emb = extractEmbeds(html);
    for (const a of assets) {
      if (!assetRefs.has(a)) assetRefs.set(a, new Set());
      assetRefs.get(a).add(slug);
    }
    for (const e of emb) {
      if (!embeds.has(e)) embeds.set(e, new Set());
      embeds.get(e).add(slug);
    }
    pages.push({ url, finalUrl: res.url, slug, links, assetCount: assets.length, embeds: emb });
    for (const l of links) if (!seen.has(l) && !excludedLinks.has(l)) queue.push(l);
    await sleep(150);
  }

  // group assets
  const groups = new Map();
  for (const url of assetRefs.keys()) {
    const a = parseAsset(url);
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(a.ext)) continue;
    if (!groups.has(a.key)) groups.set(a.key, []);
    groups.get(a.key).push(a);
  }

  const images = [];
  let i = 0;
  for (const [key, variants] of groups) {
    i++;
    variants.sort((x, y) => variantWidth(y.variant) - variantWidth(x.variant));
    const any = variants[0];
    const isCrop = variants.every((v) => /^carw/i.test(v.variant));
    const candidates = [];
    const push = (u, label) => {
      if (!candidates.some((c) => c.u === u)) candidates.push({ u, label });
    };
    for (const v of variants.filter((v) => v.variant === 'original')) push(v.url, 'original');
    if (!isCrop) {
      // synthesized originals / big renditions (hash may or may not be enforced)
      const exts = [...new Set(variants.map((v) => v.ext))];
      for (const ext of exts) {
        push(`https://cdn.myportfolio.com${any.dir}/${any.baseStem}.${ext}`, 'original-synth');
        for (const v of variants) if (v.hash) push(`https://cdn.myportfolio.com${any.dir}/${any.baseStem}.${ext}?h=${v.hash}`, 'original-synth-h');
        push(`https://cdn.myportfolio.com${any.dir}/${any.baseStem}_rw_3840.${ext}`, 'rw3840-synth');
        for (const v of variants) if (v.hash) push(`https://cdn.myportfolio.com${any.dir}/${any.baseStem}_rw_3840.${ext}?h=${v.hash}`, 'rw3840-synth-h');
      }
    }
    for (const v of variants) push(v.url, v.variant);

    let best = null;
    const tried = [];
    for (const c of candidates) {
      const r = await get(c.u, { binary: true, tries: 2 });
      tried.push({ url: c.u, status: r.status, bytes: r.ok ? r.body.length : 0 });
      if (r.ok && /^image\//.test(r.type) && r.body.length > 1000) {
        if (!best || r.body.length > best.body.length) best = { ...c, body: r.body, type: r.type };
        // An original is by definition the largest – stop there.
        if (c.label.startsWith('original')) break;
      }
      // after the explicit variants we are only going down in size
      if (best && !c.label.includes('synth') && c.label !== 'original') break;
    }
    const refs = [...new Set(variants.flatMap((v) => [...(assetRefs.get(v.url) || [])]))];
    if (best) {
      const ext = best.type.includes('png') ? 'png' : best.type.includes('gif') ? 'gif' : best.type.includes('webp') ? 'webp' : 'jpg';
      const name = `${any.baseStem}${isCrop ? '__cover' : ''}.${ext}`.replace(/[^a-zA-Z0-9._-]+/g, '_');
      await fs.writeFile(path.join(OUT, 'images', name), best.body);
      images.push({ key, file: name, from: best.u, via: best.label, bytes: best.body.length, crop: isCrop, pages: refs, variants: variants.map((v) => v.url), tried });
    } else {
      images.push({ key, file: null, crop: isCrop, pages: refs, variants: variants.map((v) => v.url), tried });
    }
    if (i % 10 === 0) console.log(`assets ${i}/${groups.size}`);
  }

  const manifest = {
    crawledAt: new Date().toISOString(),
    pages,
    skipped,
    errors,
    embeds: [...embeds].map(([url, p]) => ({ url, pages: [...p] })),
    images,
  };
  await fs.writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`pages: ${pages.length}, skipped: ${skipped.length}, errors: ${errors.length}, images: ${images.filter((x) => x.file).length}/${images.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
