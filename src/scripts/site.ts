import { initPrefs } from './prefs';
import { initChrome } from './chrome';
import { initPlayer } from './player';
import { initSound } from './sound';
import { initGrain } from './grain';
import { initWall } from './wall';
import { initOpening } from './opening';
import { initReel } from './reel';
import { initSoundtrack } from './soundtrack';
import { initCredits } from './credits';

// Once per full load (these survive client-side navigation):
initPrefs();
initSound();
initPlayer();

// Every page (initial load and after each client-side navigation):
let cleanup: ((() => void) | undefined)[] = [];
const idle = (f: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 800 }) : setTimeout(f, 200));
document.addEventListener('astro:page-load', () => {
  idle(initGrain);
  cleanup.push(initChrome(), initOpening(), initWall(), initReel(), initSoundtrack(), initCredits());
});
document.addEventListener('astro:before-swap', () => {
  cleanup.forEach((f) => f?.());
  cleanup = [];
});
