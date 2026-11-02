import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const req = createRequire(path.join(process.cwd(), 'package.json'));
const pkgDir = (name: string) => path.dirname(req.resolve(`${name}/package.json`));

/** Text → SVG path (so OG images never depend on fonts installed on the build machine). */
const fonts = new Map<string, opentype.Font>();
function font(file: string) {
  if (!fonts.has(file)) {
    const b = fs.readFileSync(file);
    fonts.set(file, opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
  }
  return fonts.get(file)!;
}
export const SERIF = path.join(pkgDir('@expo-google-fonts/noto-serif-kr'), '400Regular/NotoSerifKR_400Regular.ttf');
export const SERIF_LIGHT = path.join(pkgDir('@expo-google-fonts/noto-serif-kr'), '300Light/NotoSerifKR_300Light.ttf');
export const SANS = path.join(pkgDir('pretendard'), 'dist/public/static/Pretendard-Medium.otf');

type Cmd = { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };
const r = (v?: number) => (Number.isFinite(v) ? Math.round((v as number) * 10) / 10 : 0);
/** Own serializer: opentype.js 2.0's toPathData turns values like 796.0000000000001 into "NaN". */
function toD(cmds: Cmd[]) {
  let out = '';
  for (const c of cmds) {
    if (c.type === 'M' || c.type === 'L') out += `${c.type}${r(c.x)} ${r(c.y)}`;
    else if (c.type === 'Q') out += `Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`;
    else if (c.type === 'C') out += `C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`;
    else if (c.type === 'Z') out += 'Z';
  }
  return out;
}

// opentype.js's shaping pass produces NaN coordinates for some strings in Noto
// Serif KR, so text is laid out glyph by glyph (Hangul needs no shaping).
export function textPath(text: string, file: string, size: number, x: number, y: number, opts: { tracking?: number; maxWidth?: number } = {}) {
  const f = font(file);
  const tracking = opts.tracking ?? 0;
  const chars = [...text];
  const adv = (ch: string, sz: number) => (f.charToGlyph(ch).advanceWidth ?? 0) * (sz / f.unitsPerEm);
  const width = (sz: number) => chars.reduce((w, ch) => w + adv(ch, sz), 0) + tracking * sz * Math.max(0, chars.length - 1);
  let s = size;
  if (opts.maxWidth) while (s > 12 && width(s) > opts.maxWidth) s -= 1;
  let cx = x;
  let d = '';
  for (const ch of chars) {
    d += toD(f.charToGlyph(ch).getPath(cx, y, s).commands as Cmd[]);
    cx += adv(ch, s) + tracking * s;
  }
  return { d, width: width(s), size: s };
}
