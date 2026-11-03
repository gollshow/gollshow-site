/**
 * Physical size from the free-text `size` field, in millimetres.
 * Accepts what painters write: "1200x870mm", "530X455mm", "596×896㎜",
 * "72.7 × 60.6 cm", "72.7x60.6". Without a unit, numbers above 200 are read as
 * millimetres and smaller ones as centimetres. Returns undefined when unsure.
 */
export function parseSize(s?: string): { a: number; b: number; area: number } | undefined {
  if (!s) return;
  const m = s.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(?:mm|㎜|cm|㎝)?\s*[x×X*]\s*(\d+(?:\.\d+)?)\s*(mm|㎜|cm|㎝|m)?/);
  if (!m) return;
  let a = Number(m[1]);
  let b = Number(m[2]);
  const unit = m[3] ?? (/cm|㎝/.test(s) ? 'cm' : /mm|㎜/.test(s) ? 'mm' : a > 200 || b > 200 ? 'mm' : 'cm');
  const k = unit === 'm' ? 1000 : unit === 'cm' || unit === '㎝' ? 10 : 1;
  a *= k;
  b *= k;
  if (!(a > 20 && b > 20 && a < 20000 && b < 20000)) return;
  return { a, b, area: a * b };
}
