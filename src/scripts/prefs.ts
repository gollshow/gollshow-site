const set = (k: string, v: string | null) => {
  try {
    v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
  } catch {}
};
const apply = () => (window as any).__gollPrefs?.();

/** KO/EN and light/dark toggles (delegated, so they work on every page). */
export function initPrefs() {
  document.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-lang-toggle]')) {
      const next = document.documentElement.dataset.lang === 'ko' ? 'en' : 'ko';
      set('goll:lang', next);
      apply();
      document.dispatchEvent(new CustomEvent('goll:lang', { detail: next }));
    }
    if (t.closest('[data-theme-toggle]')) {
      const d = document.documentElement;
      const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
      const now = d.dataset.theme ?? (sysDark ? 'dark' : 'light');
      const next = now === 'dark' ? 'light' : 'dark';
      // going back to what the OS wants = forget the override
      set('goll:theme', (next === 'dark') === sysDark ? null : next);
      apply();
    }
  });
}
