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

export function textPath(text: string, file: string, size: number, x: number, y: number, opts: { tracking?: number; maxWidth?: number } = {}) {
  const f = font(file);
  let s = size;
  const tracking = opts.tracking ?? 0;
  const width = (sz: number) => f.getAdvanceWidth(text, sz) + tracking * sz * Math.max(0, [...text].length - 1);
  if (opts.maxWidth) while (s > 12 && width(s) > opts.maxWidth) s -= 1;
  if (!tracking) return { d: f.getPath(text, x, y, s).toPathData(1), width: width(s), size: s };
  let cx = x;
  let d = '';
  for (const ch of text) {
    d += f.getPath(ch, cx, y, s).toPathData(1);
    cx += f.getAdvanceWidth(ch, s) + tracking * s;
  }
  return { d, width: width(s), size: s };
}
