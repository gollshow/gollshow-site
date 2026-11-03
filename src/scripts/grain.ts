/** Film grain: one noise tile, drawn once, shared by every .grain layer through --grain. */
export function initGrain() {
  const d = document.documentElement;
  if (d.style.getPropertyValue('--grain')) return;
  try {
    const n = 192;
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const x = c.getContext('2d')!;
    const img = x.createImageData(n, n);
    for (let i = 0; i < img.data.length; i += 4) {
      // clumped, slightly soft grain: average of two samples
      const v = ((Math.random() + Math.random()) / 2) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    d.style.setProperty('--grain', `url(${c.toDataURL('image/png')})`);
  } catch {}
}
