# DESIGN — 空

> 비어 있음이 재료다. Emptiness is the material.

This document is the contract for every page of gollshow.com. When in doubt, remove something.

---

## 1. Concept

The old landing page held a single character — **空** (공 / *kū*): emptiness, and also *sky*.
The new site is built around it.

* **Empty space is the main material.** A page is a white wall; a work is hung on it. Margins are generous on purpose and are never "filled up".
* **One sensibility, three media.** Painting, film and music are not separate shops — they share one typography, one rhythm, one label system (the museum caption). A song is listed the way a painting is labelled.
* **The work carries the colour.** The interface is ink on paper (or paper-light on night). The only colour on screen should come from the art.
* **Catalogue, not template.** Layouts are composed per sequence — sizes, offsets and pauses vary like a hang in a gallery, never a uniform card grid.

### Signature moments
1. **空 opens** — the landing shows only 空 in ink, breathing very slowly (the strokes swell and settle like ink soaking into hanji). On scroll the ink *bleeds* outward and the strokes become a window: a painting appears *inside* the character, the camera passes through the pillar of 工 and the work settles, framed on the wall, with its label.
2. **The hang** — category rooms are composed with a deterministic "curator" rhythm (large / pair / pause / small), always respecting each work's true aspect ratio (never cropped).
3. **The dark room** — a full-screen viewer (pinch / wheel / double-tap zoom, drag to pan, swipe or ← → between works, Esc to leave).
4. **The horizon** — music keeps playing while you walk through the rooms. The mini-player's progress is a single hairline across the bottom of the screen: a horizon line under the sky.

---

## 2. Typography

| Role | Family | Weights | Notes |
|---|---|---|---|
| Serif (KO + Latin) — titles, statements, body | **Noto Serif KR** (SIL OFL) | 300 Light, 400 Regular | Light for display ≥ 34px, Regular for text |
| Sans (KO + Latin) — UI, labels, captions | **Pretendard** (SIL OFL) | 400, 500 | |

* Fonts are **self-hosted and subset at build time** to exactly the glyphs used on the site (`scripts/fonts.mjs`), one WOFF2 per face.
* Latin labels: Pretendard 500, UPPERCASE, `letter-spacing: .18em`, 11px — the "museum label" voice.
* Numerals: `font-variant-numeric: tabular-nums` for years, counters and time.
* Korean text: `word-break: keep-all; line-break: strict;` — never break inside a word.
* Measure: 32–38em for Korean body, 60–68ch for Latin.

### Scale (fluid, `clamp()`), base 16px

| Token | Size | Use |
|---|---|---|
| `--t-label` | 11px | letter-spaced labels, counters |
| `--t-cap` | 13px | captions, meta |
| `--t-body` | 16 → 17px | text |
| `--t-lead` | 19 → 22px | intro paragraphs, work titles in lists |
| `--t-h3` | 22 → 28px | work title on detail |
| `--t-h2` | 30 → 44px | room titles |
| `--t-h1` | 40 → 76px | statements |
| `--t-kong` | min(64vmin, 620px) | the 空 |

Line-height: 1.75 for Korean body, 1.55 Latin body, 1.15 display. Display text is Light 300 with `letter-spacing: -0.01em`.

---

## 3. Grid & space

* **Desktop (≥ 1024px):** 12 columns, gutter 24px, outer margin `clamp(24px, 5vw, 88px)`, max content width 1680px.
* **Tablet (640–1023px):** 8 columns, gutter 20px.
* **Mobile (< 640px):** 4 columns, gutter 16px, outer margin 20px.
* **Spacing unit 8px.** Steps: 8 · 16 · 24 · 40 · 64 · 104 · 168. Rooms are separated by `clamp(104px, 18vh, 220px)`.
* Header and labels sit on the outer margin lines, so the edges of the screen feel like the edges of a wall.

### The hang (category rooms)
A deterministic sequence per room (`src/lib/hang.ts`), chosen by each work's aspect ratio:

* **Solo** — one work alone, landscape spans 8 cols, portrait 5 cols; alternates left / right / centre.
* **Pair** — two works, spans 5 + 4, the second dropped by ~15% of its height.
* **Pause** — one small work (3–4 cols) with extra air above and below.

Every work keeps its true proportions (`object-fit: contain` is never needed because boxes take the image ratio). A second mode, **Index** (목록), shows a tight contact sheet for scanning.

---

## 4. Colour

The palette is ink and paper. No brand colour. One exception: the **seal red** of a painter's stamp (낙관), used only for focus rings and the "now playing" dot.

| Token | Light (paper) | Dark (night) |
|---|---|---|
| `--paper` (background) | `#F4F2ED` | `#0F0F0E` |
| `--paper-2` (raised, image well) | `#ECE9E2` | `#181816` |
| `--ink` (text) | `#1A1A18` | `#ECE9E2` |
| `--ink-2` (secondary) | `#5F5D58` | `#A6A39B` |
| `--ink-3` (tertiary, hairlines on hover) | `#8D8A83` | `#6F6C66` |
| `--line` (hairline) | `rgb(26 26 24 / .14)` | `rgb(236 233 226 / .14)` |
| `--seal` | `#A8362A` | `#E0725F` |
| Viewer (always) | `#0B0B0A` | `#0B0B0A` |

* Theme follows `prefers-color-scheme`; a toggle (◐) overrides and is remembered.
* Contrast: body text ≥ 7:1, secondary ≥ 4.5:1 in both themes.
* Image wells (placeholders while loading) use each image's own dominant colour + blurred LQIP.

---

## 5. Motion

Motion is breath, not decoration.

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` |
| `--d-fast` | 160ms (hover, toggles) |
| `--d-mid` | 420ms (reveals) |
| `--d-slow` | 760ms (page transitions, image settle) |
| breath | 7s cycle |

Rules:
1. **Reveal once.** Images settle from their blurred placeholder (opacity + 8px blur → sharp, 760ms). Text rises 12px and fades in, staggered 60ms. Never re-animate on scroll back.
2. **Shared-element transitions.** A work in a room morphs into the large image on its page (View Transitions via Astro's `<ClientRouter />`); everything else cross-fades 280ms.
3. **Only transform and opacity** are animated (plus the canvas for 空). No layout animation.
4. **Hover** is quiet: a 1px underline grows under titles; images do not zoom.
5. **`prefers-reduced-motion: reduce`** — no breathing, no zoom-through (the landing shows 空 and the work side by side), no morphs; fades ≤ 150ms.

---

## 6. Components & voice

* **Header** — left: `goll` wordmark (serif); right: 작품 Works · 음악 Music · 소개 About · KO/EN · ◐. Mobile: wordmark + "Menu" → full-screen index with large serif items.
* **Label (캡션)** — number · title (serif) · year · medium · size, in that order. Missing fields are simply absent, never "N/A".
* **Bilingual** — Korean first. The KO/EN switch swaps all text instantly without reloading (and without stopping the music); the choice is remembered. If an English text is missing, Korean is shown.
* **Empty rooms** — a category without works shows a quiet 空 and one line: “아직 비어 있는 방입니다. / This room is still empty.” Emptiness is part of the concept, not an error.

---

## 7. Performance & accessibility budget

* Mobile Lighthouse ≥ 95 for Performance, Accessibility, SEO.
* Images: AVIF + WebP, widths 480 / 800 / 1200 / 1800 / 2560, lazy below the fold, LQIP (16px) + dominant colour inline.
* Fonts: exact subsets, `font-display: swap`, the display serif preloaded.
* JS: no framework runtime on the client; small vanilla modules (viewer, player, 空 canvas).
* Every interactive element is reachable by keyboard and has a visible seal-red focus ring; the viewer is a modal `<dialog>`.
