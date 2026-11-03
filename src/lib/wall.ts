/**
 * The wall: every visual work hung on one long studio wall, in reel order.
 * Units are millimetres. x runs along the wall from 0; y = 0 is the eye line
 * (positive is down). A loose salon hang: single works and stacks of two,
 * irregular gaps, offsets from the eye line. Deterministic: the jitter of a
 * work comes from its slug, so it does not move when other works change.
 *
 * Scale: works with a known physical `size` hang at that area. Works without
 * one get the same neutral area (DEFAULT_AREA) so none of them pretends to a
 * size; the image keeps its own proportions.
 */
export const WALL_H = 2100; // mm of wall visible from floor to ceiling of the viewport
export const DEFAULT_AREA = 0.3e6; // mm² (0.30 m²)

export type WallIn = { key: string; room: string; ratio: number; area?: number; label?: number /* room name length in characters */ };
export type Hung = { key: string; x: number; y: number; w: number; h: number };
export type RoomMark = { room: string; x: number; start: number; end: number };

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r: () => number, a: number, b: number) => a + (b - a) * r();

export function dims(ratio: number, area = DEFAULT_AREA) {
  let w = Math.sqrt(area * ratio);
  let h = Math.sqrt(area / ratio);
  // never taller than the wall can show
  const maxH = WALL_H * 0.78;
  if (h > maxH) ((w *= maxH / h), (h = maxH));
  return { w: Math.round(w), h: Math.round(h) };
}

export function hangWall(items: WallIn[]) {
  const hung: Hung[] = [];
  const rooms: RoomMark[] = [];
  let x = 300; // lead-in from the left edge of the wall
  let i = 0;
  let room = '';
  while (i < items.length) {
    const it = items[i];
    if (it.room !== room) {
      if (room) {
        rooms[rooms.length - 1].end = x;
        x += 1100; // a stretch of bare wall between reels
      }
      room = it.room;
      rooms.push({ room, x, start: x, end: x });
      x += Math.round((it.label ?? 2) * 205 + 300); // room name painted on the wall, then the first work
    }
    const r = rng(it.key);
    const a = { ...it, ...dims(it.ratio, it.area) };
    const next = items[i + 1];
    const b = next && next.room === room ? { ...next, ...dims(next.ratio, next.area) } : undefined;
    const vgap = between(r, 110, 170);
    const canStack = b && !it.area && !next!.area && a.h <= 760 && b.h <= 760 && a.h + b.h + vgap <= 1420 && Math.max(a.w, b.w) < 1.9 * Math.min(a.w, b.w);
    const stack = canStack && r() < 0.7;
    if (stack && b) {
      const sw = Math.max(a.w, b.w);
      const total = a.h + vgap + b.h;
      const top = -total / 2 + between(r, -70, 50);
      const place = (o: typeof a, y: number) => {
        const slack = sw - o.w;
        const align = r();
        const dx = slack * (align < 0.33 ? 0 : align < 0.66 ? 0.5 : 1) + between(r, -30, 30);
        hung.push({ key: o.key, x: Math.round(x + dx), y: Math.round(y), w: o.w, h: o.h });
      };
      place(a, top);
      place(b, top + a.h + vgap);
      x += sw;
      i += 2;
    } else {
      // single: centred near the eye line, a little above or below
      const y = -a.h / 2 + between(r, -130, 90);
      hung.push({ key: a.key, x: Math.round(x), y: Math.round(y), w: a.w, h: a.h });
      x += a.w;
      i += 1;
    }
    x += Math.round(between(r, 220, 420));
  }
  if (rooms.length) rooms[rooms.length - 1].end = x;
  const length = Math.round(x + 900);
  return { hung, rooms, length };
}
