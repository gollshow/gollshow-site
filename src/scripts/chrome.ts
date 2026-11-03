/** Per-page chrome: the mobile menu. Returns a cleanup for client-side navigation. */
export function initChrome(): () => void {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (!menu || !openBtn) return () => {};
  const open = () => {
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    menu.querySelector<HTMLElement>('a, button')?.focus();
  };
  const close = () => {
    menu.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !menu.hidden && (close(), openBtn.focus());
  openBtn.addEventListener('click', open);
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => (close(), openBtn.focus()));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  addEventListener('keydown', onKey);
  return () => (removeEventListener('keydown', onKey), close());
}
