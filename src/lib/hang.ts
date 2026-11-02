/**
 * The "hang": a deterministic, curated layout for a room.
 * Rows follow a rhythm — solo, pair, pause — chosen by aspect ratio, so no
 * two rooms look like a uniform card grid. Works are never cropped: every box
 * takes the work's own ratio.
 */
export type Slot = {
  row: number;
  // desktop 12-col
  dStart: number;
  dSpan: number;
  dShift: number; // vertical offset in "steps" (each step = 4vw clamp)
  // tablet 8-col
  tStart: number;
  tSpan: number;
  // mobile: width % and alignment
  mW: number;
  mAlign: 'start' | 'end' | 'center';
  kind: 'solo' | 'pair' | 'pause';
};

const RHYTHM = ['solo-l', 'pair', 'solo-r', 'pause-r', 'pair-rev', 'solo-c', 'pair', 'pause-l'] as const;

const kindOf = (r: number) => (r >= 1.25 ? 'land' : r <= 0.8 ? 'port' : 'sq');

export function hang(ratios: number[]): Slot[] {
  const out: Slot[] = [];
  let i = 0;
  let row = 0;
  let step = 0;
  let mobileFlip = 0;
  const mobile = (r: number, kind: Slot['kind']) => {
    const k = kindOf(r);
    if (k === 'land') return { mW: 100, mAlign: 'start' as const };
    if (kind === 'pause') return { mW: 64, mAlign: 'center' as const };
    mobileFlip++;
    return { mW: k === 'sq' ? 86 : 80, mAlign: mobileFlip % 2 ? ('start' as const) : ('end' as const) };
  };
  const tab = (start: number, span: number) => {
    const tSpan = Math.max(4, Math.min(8, Math.round((span * 8) / 12) + 1));
    const tStart = Math.min(9 - tSpan, Math.max(1, Math.round(((start - 1) * 8) / 12) + 1));
    return { tStart, tSpan };
  };

  while (i < ratios.length) {
    const beat = RHYTHM[step % RHYTHM.length];
    step++;
    const r = ratios[i];
    const k = kindOf(r);
    const remaining = ratios.length - i;

    if (beat.startsWith('pair') && remaining >= 2) {
      const r2 = ratios[i + 1];
      const k2 = kindOf(r2);
      // two landscapes don't pair well – hang them as solos
      if (k === 'land' && k2 === 'land') {
        step--; // retry this beat as a solo
        const span = 8;
        const start = row % 2 ? 5 : 1;
        out.push({ row, dStart: start, dSpan: span, dShift: 0, ...tab(start, span), ...mobile(r, 'solo'), kind: 'solo' });
        i++;
        row++;
        continue;
      }
      const spanA = k === 'land' ? 7 : k === 'sq' ? 5 : 5;
      const spanB = k2 === 'land' ? 6 : k2 === 'sq' ? 4 : 4;
      const rev = beat === 'pair-rev';
      const aStart = rev ? 13 - spanA : 1;
      const bStart = rev ? 1 : 13 - spanB;
      out.push({ row, dStart: aStart, dSpan: spanA, dShift: 0, ...tab(aStart, spanA), ...mobile(r, 'pair'), kind: 'pair' });
      out.push({ row, dStart: bStart, dSpan: spanB, dShift: 3, ...tab(bStart, spanB), ...mobile(r2, 'pair'), kind: 'pair' });
      i += 2;
    } else if (beat.startsWith('pause') && ratios.length > 2) {
      const span = k === 'land' ? 5 : 4;
      const start = beat === 'pause-r' ? 8 : 2;
      const s = Math.min(start, 13 - span);
      out.push({ row, dStart: s, dSpan: span, dShift: 0, ...tab(s, span), ...mobile(r, 'pause'), kind: 'pause' });
      i++;
    } else {
      const span = k === 'land' ? 8 : k === 'sq' ? 6 : 5;
      const start = beat === 'solo-r' ? 13 - span - 1 : beat === 'solo-c' || ratios.length === 1 ? Math.round((13 - span) / 2) : 2;
      out.push({ row, dStart: Math.max(1, start), dSpan: span, dShift: 0, ...tab(Math.max(1, start), span), ...mobile(r, 'solo'), kind: 'solo' });
      i++;
    }
    row++;
  }
  return out;
}
