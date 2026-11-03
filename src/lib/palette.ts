import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Colours sampled from each image at build time (automatic: nothing to do in
 * /admin). k-means on a 48 px thumbnail gives:
 *   dominant – the largest colour cluster (the wall's bounce light)
 *   accent   – the most saturated cluster with real weight (the beam's tint)
 *   lum      – mean luminance 0..1
 * Results are cached in .cache/palette.json by file size + mtime.
 */
export type Palette = { dominant: string; accent: string; lum: number };

const CACHE = path.join(process.cwd(), '.cache', 'palette.json');
let disk: Record<string, Palette & { key: string }> | undefined;
const load = () => {
  if (disk) return disk;
  try {
    disk = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  } catch {
    disk = {};
  }
  return disk!;
};
let dirty = false;
let timer: NodeJS.Timeout | undefined;
const save = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    if (!dirty) return;
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(disk));
    dirty = false;
  }, 200);
};

const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

function sat([r, g, b]: number[]) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}

const memo = new Map<string, Promise<Palette>>();

export function palette(file: string): Promise<Palette> {
  if (memo.has(file)) return memo.get(file)!;
  const p = (async () => {
    const abs = path.join(process.cwd(), file);
    let key = '';
    try {
      const st = fs.statSync(abs);
      key = `${st.size}-${Math.round(st.mtimeMs)}`;
    } catch {
      return { dominant: '#4a443d', accent: '#f6e7c8', lum: 0.4 };
    }
    const c = load()[file];
    if (c && c.key === key) return { dominant: c.dominant, accent: c.accent, lum: c.lum };

    const { data, info } = await sharp(abs, { failOn: 'none' }).rotate().resize(48, 48, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const px: number[][] = [];
    for (let i = 0; i < data.length; i += info.channels) px.push([data[i], data[i + 1], data[i + 2]]);
    const lum = px.reduce((s, [r, g, b]) => s + (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 0) / px.length;

    // k-means, k = 5, deterministic seeds spread over luminance
    const K = 5;
    const sorted = [...px].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
    let cents = Array.from({ length: K }, (_, k) => [...sorted[Math.floor(((k + 0.5) / K) * sorted.length)]]);
    let counts = new Array(K).fill(0);
    for (let it = 0; it < 12; it++) {
      const sums = Array.from({ length: K }, () => [0, 0, 0]);
      counts = new Array(K).fill(0);
      for (const p of px) {
        let best = 0;
        let bd = Infinity;
        for (let k = 0; k < K; k++) {
          const d = (p[0] - cents[k][0]) ** 2 + (p[1] - cents[k][1]) ** 2 + (p[2] - cents[k][2]) ** 2;
          if (d < bd) ((bd = d), (best = k));
        }
        sums[best][0] += p[0];
        sums[best][1] += p[1];
        sums[best][2] += p[2];
        counts[best]++;
      }
      cents = cents.map((c, k) => (counts[k] ? sums[k].map((s) => s / counts[k]) : c));
    }
    const clusters = cents.map((c, k) => ({ c, n: counts[k] / px.length })).sort((a, b) => b.n - a.n);
    const dominant = clusters[0].c;
    const weighty = clusters.filter((x) => x.n >= 0.08);
    const accent = [...weighty].sort((a, b) => sat(b.c) * Math.sqrt(b.n) - sat(a.c) * Math.sqrt(a.n))[0]?.c ?? dominant;
    const out = { dominant: hex(dominant), accent: hex(accent), lum: Math.round(lum * 1000) / 1000 };
    load()[file] = { ...out, key };
    dirty = true;
    save();
    return out;
  })();
  memo.set(file, p);
  return p;
}
