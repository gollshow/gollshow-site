import { initPrefs } from './prefs';
import { initChrome } from './chrome';
import { initPlayer } from './player';
import { initViewer } from './viewer';
import { initKong } from './kong';

// Once per full load (these survive client-side navigation):
initPrefs();
initPlayer();

// Every page (initial load and after each client-side navigation):
document.addEventListener('astro:page-load', () => {
  initChrome();
  initViewer();
  initKong();
});

// Click-to-load embeds (delegated once)
document.addEventListener('click', (e) => {
  const box = (e.target as Element).closest<HTMLElement>('[data-embed]');
  if (!box || box.querySelector('iframe')) return;
  const f = document.createElement('iframe');
  f.src = box.dataset.embed!;
  f.title = box.dataset.embedTitle || 'Player';
  f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
  f.allowFullscreen = true;
  box.replaceChildren(f);
});
