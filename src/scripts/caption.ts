/** Captions hold only real data. Both languages are rendered; CSS shows one. */
export type Cap = {
  title?: string;
  title_en?: string;
  year?: string;
  sm?: string; // size + medium, exactly as written
  sm_en?: string;
  room_ko: string;
  room_en: string;
  frame: string; // "017"
  total: string; // "066"
};

const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function bi(cls: string, ko?: string, en?: string) {
  if (!ko && !en) return '';
  if (!en || en === ko) return `<span class="${cls}">${esc(ko ?? en)}</span>`;
  if (!ko) return `<span class="${cls}">${esc(en)}</span>`;
  return `<span class="${cls} t" lang="ko">${esc(ko)}</span><span class="${cls} t" lang="en">${esc(en)}</span>`;
}

/** Reel + frame, then title, year, size and medium when known. */
export function capHTML(c: Cap, opts: { frame?: boolean } = {}) {
  const frame = opts.frame === false ? '' : `<span class="c-frame"><span class="t" lang="ko">${esc(c.room_ko)}</span><span class="t" lang="en">${esc(c.room_en)}</span> <span class="count">${c.frame} / ${c.total}</span></span>`;
  return frame + bi('c-title', c.title, c.title_en) + (c.year ? `<span class="c-year count">${esc(c.year)}</span>` : '') + bi('c-sm', c.sm, c.sm_en);
}

export const nameOf = (c: Cap, en: boolean) => (en ? c.title_en ?? c.title ?? `${c.room_en} ${c.frame}` : c.title ?? `${c.room_ko} ${c.frame}`);
