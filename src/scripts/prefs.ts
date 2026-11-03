const set = (k: string, v: string | null) => {
  try {
    v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
  } catch {}
};

/** KO/EN toggle (delegated, so it works on every page). */
export function initPrefs() {
  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[data-lang-toggle]')) return;
    const next = document.documentElement.dataset.lang === 'ko' ? 'en' : 'ko';
    set('goll:lang', next);
    (window as any).__gollPrefs?.();
    document.dispatchEvent(new CustomEvent('goll:lang', { detail: next }));
  });
}
