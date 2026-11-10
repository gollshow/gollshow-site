/** Shared between the home motion (which writes it every frame), the sound and the room list. */
export const stir: {
  x: number;
  y: number;
  v: number;
  intro: number;
  /** true while a room in the list is pointed at */
  hover: boolean;
  /** that room's four colours (0–1 rgb), or null */
  hoverPal: number[][] | null;
  /** called for every drop that falls: its height (−0.5 … 0.5) and whether it fell by itself */
  onDrop?: (y: number, quiet: boolean) => void;
} = { x: 0.5, y: 0.5, v: 0, intro: 0, hover: false, hoverPal: null };
