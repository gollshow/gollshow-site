/**
 * The hang: works laid out like the spreads of an art book on a 12-column sheet,
 * rather than a uniform grid. An L work gets a row to itself, set off to one side
 * with its wall label beside it; the others come in pairs (stepped, one lower than
 * the other) and trios (on a shared centre line), with a single work given room now
 * and then. The rhythm is fixed by the order set in /admin, so it never reshuffles.
 */
export type Cell = {
  i: number; // index into the works
  start: number; // 1-based grid column
  span: number;
  align: 'start' | 'center' | 'end';
  drop: 0 | 1; // a pair's lower work
  justify: 'start' | 'end';
  label: 'none' | 'below' | { start: number; span: number };
};
export type Row = { kind: 'solo' | 'pair' | 'trio'; cells: Cell[] };

type W = { w: number; h: number; display: 'S' | 'M' | 'L'; title?: unknown };

const shape = (w: W) => {
  const a = w.w / w.h;
  return a > 1.2 ? 'land' : a < 0.85 ? 'port' : 'sq';
};

// Columns a work takes in a pair or trio, and alone.
const inGroup = (w: W) => {
  const s = shape(w) === 'land' ? 5 : 4;
  return w.display === 'S' ? s - 1 : s;
};
const alone = (w: W, big: boolean) => {
  const sh = shape(w);
  if (big) return sh === 'land' ? 9 : sh === 'port' ? 6 : 7;
  return sh === 'land' ? 7 : sh === 'port' ? 5 : 6;
};

// Pairs, trios and the occasional single work, in this order.
const RHYTHM = [2, 3, 2, 1, 3, 2, 2, 1, 3];
const LEADS = [0, 1, 2, 1, 0, 2, 1];

export function hang(works: W[]): Row[] {
  const rows: Row[] = [];
  let i = 0, r = 0, side = 0;

  const solo = (idx: number, big: boolean) => {
    const w = works[idx];
    const span = alone(w, big);
    const left = side++ % 2 === 0;
    const start = left ? (big ? 1 : 2) : 13 - span - (big ? 0 : 1);
    let label: Cell['label'] = 'none';
    if (w.title) {
      const free = left ? 12 - (start + span - 1) : start - 1;
      label = free >= 3 ? { start: left ? start + span + 1 : Math.max(1, start - 4), span: Math.min(3, free - 1) } : 'below';
    }
    rows.push({ kind: 'solo', cells: [{ i: idx, start, span, align: 'end', drop: 0, justify: left ? 'start' : 'end', label }] });
  };

  while (i < works.length) {
    if (works[i].display === 'L') {
      solo(i++, true);
      r++;
      continue;
    }
    const n = RHYTHM[r % RHYTHM.length];
    if (n === 1) {
      solo(i++, false);
      r++;
      continue;
    }
    const idx: number[] = [];
    while (idx.length < n && i < works.length && works[i].display !== 'L') idx.push(i++);
    const spans = idx.map((k) => inGroup(works[k]));
    const minGap = idx.length - 1;
    while (spans.reduce((a, b) => a + b, 0) + minGap > 12) spans[spans.indexOf(Math.max(...spans))]--;
    const leftover = 12 - spans.reduce((a, b) => a + b, 0);
    const lead = Math.max(0, Math.min(LEADS[r % LEADS.length], leftover - minGap));
    const gap = idx.length > 1 ? Math.max(1, Math.min(2, Math.floor((leftover - lead) / idx.length))) : 0;
    let col = 1 + lead;
    const kind = idx.length === 3 ? 'trio' : idx.length === 2 ? 'pair' : 'solo';
    const flip = r % 2 === 1;
    const cells: Cell[] = idx.map((k, j) => {
      const c: Cell = {
        i: k,
        start: col,
        span: spans[j],
        align: kind === 'trio' ? 'center' : 'start',
        drop: kind === 'pair' && (j === 1) !== flip ? 1 : 0,
        justify: 'start',
        label: works[k].title ? 'below' : 'none',
      };
      col += spans[j] + gap;
      return c;
    });
    // A lone leftover at the end of the list sits off-centre rather than flush left.
    if (kind === 'solo' && cells.length === 1) cells[0].start = Math.min(4, 13 - cells[0].span);
    rows.push({ kind, cells });
    r++;
  }
  return rows;
}
