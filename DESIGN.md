# DESIGN — 영사실 (the projection room)

> 불을 끄면 그림은 거의 보이지 않는다. 빛이 지나가야 보인다.
> With the lights off the paintings are barely there. They appear where the light passes.

This document is the contract for every page of gollshow.com, round 2. Round 1 ("空, a white wall") was rejected as a tidy template; nothing of its look survives. Section 9 records what this plan changed after reviewing itself against the brief.

---

## 1. One idea for three disciplines

goll paints, composes (as **gogolala**) and directs films. The site is a dark **projection room**:

| Discipline | What it becomes on the site |
|---|---|
| Painting | what the projector throws on the wall: the works hang on a long dark studio wall |
| Film | the projector itself: the beam, the opening title card, the reel, the hard splice between frames, grain and gate weave |
| Music | the **sound side of the film strip**: a variable-area optical soundtrack, the waveform printed along the edge of the film |

**Spend boldness in one place: the wall and the beam.** Everything else (reels, music, about, captions) is quiet black, set type and real data.

---

## 2. Colour

There is no accent colour. Colour comes from the paintings: the beam takes the colour of the work under it, and the wall around a lit work catches its bounce light.

| Token | Value | Use | Contrast on #000 |
|---|---|---|---|
| `--black` | `#000000` | projection black: page, unlit wall | — |
| `--beam` | `#F6E7C8` | tungsten light: the beam, focus ring, current item, flash | 17.2 : 1 |
| `--screen` | `#ECEAE4` | text | 17.5 : 1 |
| `--ash` | `#8A847C` | secondary text | 5.7 : 1 |
| `--dust` | `#6B6660` | hairlines, sprocket holes, inactive marks only (**not text**: 3.7 : 1) | — |
| `--wall` | `#4A443D` | the plaster of the studio wall (its albedo; you only see it where the beam falls) | — |
| `--base` | `#0B0907` | film base of the reel strip | — |
| `--tint` | per work | sampled at build time from each image (dominant + most saturated colour) | — |

Light model on the wall: **colour on screen = paint (or plaster) × light**. Ambient light is 5 %, so unlit works are barely visible. The beam is tungsten mixed 35 % toward the lit work's saturated colour; the wall around the lit work receives a soft bounce in the work's dominant colour.

---

## 3. Type

**Hahmlet** (Hypertype, SIL OFL), variable weight 100–900, self-hosted and subset at build to exactly the characters used (`scripts/fonts.mjs`). Hahmlet has no width axis and no Hanja, so:

* the "condensed" voice of the brief is replaced by **weight and tracking**: title cards, room names and credits are set very light (200) and large, like projected light; reading text is 400; the few interface words are 500 at a small size;
* glyphs Hahmlet lacks (空, ㎜, rare Hangul or Hanja an editor may type) fall back to a second face, **Noto Serif KR** (OFL), subset to exactly those characters. 空 on the title card is Noto Serif KR.

| Token | Size | Weight | Use |
|---|---|---|---|
| `--t-card` | `min(42vmin, 420px)` | Noto Serif KR 400 | 空 on the opening title card |
| `--t-title` | `clamp(2.75rem, 1.6rem + 5vw, 6.5rem)` | 200 | room names, gogolala, credit names |
| `--t-head` | `clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)` | 300 | work titles in the viewer and on work pages |
| `--t-body` | `1rem → 1.0625rem` | 400 | reading, captions |
| `--t-ui` | `0.9375rem` | 500 | navigation, controls (sentence case, no tracking) |
| `--t-small` | `0.8125rem` | 400 | secondary captions |

* Frame counters (`017 / 066`) use Hahmlet's tabular lining figures (`tnum`, `lnum`). No monospace anywhere.
* No ALL CAPS, no letter-spaced eyebrow labels. Korean `word-break: keep-all`.

---

## 4. Layouts

### 4.1 Home — the wall and the beam

Every visual work hangs on one long wall in reel order (회화 → 콩테·파스텔 → 디지털 → 그 밖의 작업), loosely, in a salon hang: single works and stacks of two, offset from the eye line, irregular gaps, never a grid. Scrolling (wheel, trackpad, keys, swipe) or dragging travels along the wall. The pointer is the projector's beam; on touch the beam stays in the centre and the wall moves under it.

**Scale is real where it is known.** A work with a `size` (e.g. `1200x870mm`) hangs at that physical area; works without a size get one neutral area (0.30 m²) so none of them pretends to a size. When the owner types a size in /admin, the work takes its true scale on the next build.

```
desktop 1440 × 900
┌──────────────────────────────────────────────────────────────────────────────┐
│ goll         회화   콩테·파스텔   디지털   음악   소개           English  소리 켜기 │
│                                                                              │
│        ░░░                     .  ·  .                                       │
│ 회화   ░░░     ▒▒▒▒         .  ▓▓▓▓▓▓  .        ░░░░       ░░                 │
│        ░░░     ▒▒▒▒  ░░    .   ▓▓▓▓▓▓   .       ░░░░       ░░     ← unlit:   │
│                ▒▒▒▒  ░░    ·   ▓▓▓▓▓▓   ·              ░░░        barely      │
│  ░░░░                       .  ▓▓▓▓▓▓  .   ← the beam:  ░░░        visible    │
│  ░░░░         ░░░░           ·  .  ·  .     tungsten tinted by the work     │
│               ░░░░                ╲                                          │
│                                    ╲  (a faint cone of dust from the          │
│                                     ╲  projector, bottom centre)              │
│ gogo  1200x870mm Oil                                                          │
│ ───────●──────────────────────┬────────────────────────┬────────── 회화 001 / 066 │
└──────────────────────────────────────────────────────────────────────────────┘

mobile 390 × 844
┌──────────────────────────┐
│ goll        메뉴   소리 켜기 │
│                          │
│   ░░    .  ·  .     ░░   │
│   ░░  . ▓▓▓▓▓▓ .   ░░    │
│       · ▓▓▓▓▓▓ ·         │   the beam is fixed in the centre;
│   ░░  . ▓▓▓▓▓▓ .   ░░░   │   swiping moves the wall under it
│   ░░    .  ·  .    ░░░   │
│                          │
│ 회화  017 / 066            │
│ ───●────────┬──────┬──── │
└──────────────────────────┘
```

* Bottom: the work under the beam (its real caption, or room and frame) and a hairline of the whole wall with a mark for each reel; the tungsten dot is where you are. Clicking a reel's mark travels there.
* Click or Enter on a work: the beam narrows onto it and the work is **projected** (4.2).
* Keyboard: Tab moves the beam from work to work (the wall travels to keep it centred); arrow keys and Page keys travel.

### 4.2 Viewer — the projection

```
┌────────────────────────────────────────────────────────┐
│ 017 / 066                                         닫기  │
│                                                        │
│               ┌────────────────────┐                   │
│               │                    │  grain            │
│  이전          │   the work, large   │  gate weave   다음 │
│               │   halation glow     │  vignette         │
│               │                    │                   │
│               └────────────────────┘                   │
│                                                        │
│ gogo                                                   │
│ 2024                                                   │
│ 1200x870mm Oil                    작업 과정 영상          │
└────────────────────────────────────────────────────────┘
```

* Film grain, gentle gate weave (sub-pixel), warm halation around highlights, soft vignette. This flatters the small Adobe images honestly: nothing is upscaled with AI or sharpened.
* ← → keys, swipes and the 이전/다음 buttons advance like a reel: a **hard splice cut** (no crossfade) with a single-frame tungsten flash and a splice line.
* Counter `017 / 066` is the frame within its reel (the works are a sequence). Crossing into the next reel resets it and changes the reel name.
* Caption = only real data: title, year, size and medium when known (`1200x870mm Oil` is shown exactly as written). Untitled works show their reel name; the counter gives the frame.
* Esc / 닫기 / swipe down returns to where you were; the beam comes back on that work.

### 4.3 Reels — a room page (회화, 콩테·파스텔, 디지털, 영화)

A room is one reel of film running vertically through the gate. The frame in the gate (middle of the screen) is lit; the frames above and below are in the dark. Light shows through the sprocket holes by the gate.

```
desktop                                          mobile
┌───────────────────────────────────────────────┐ ┌────────────────────┐
│ goll         nav                               │ │ goll   메뉴  소리 켜기│
│                ┌─┬────────────────┬─┐          │ │ 회화               │
│                │▫│                │▫│          │ │ ┌┬────────────┬┐  │
│ 회화            │▫│   frame 016    │▫│ 016       │ │ ▫│  frame 016  │▫  │
│                │▫│   (dark)       │▫│          │ │ ├┼────────────┼┤  │
│                ├─┼────────────────┼─┤          │ │ ▫│            │▫  │
│                │▪│                │▪│ 017       │ │ ▪│  frame 017  │▪  │ ← gate
│ 017 / 066   ━━━│▪│   frame 017    │▪│━━━       │ │ ▪│   (lit)     │▪  │
│ gogo           │▪│   (lit)        │▪│          │ │ ├┼────────────┼┤  │
│ 1200x870mm Oil ├─┼────────────────┼─┤          │ │ ▫│  frame 018  │▫  │
│                │▫│   frame 018    │▫│ 018       │ │ 017 / 066  회화    │
│                │▫│   (dark)       │▫│          │ └────────────────────┘
└───────────────────────────────────────────────┘
```

* Frame numbers are printed on the film's edge (they are a real sequence). The reel ends with a tail leader that leads into the next reel.
* Native vertical scroll; the gate is an IntersectionObserver line, so it costs nothing.
* A room with no works has no page and no link (영화 appears only when a film work exists).

### 4.4 Music — the sound side of the strip

```
┌──────────────────────────────────────────────────────────────┐
│ goll        nav                                              │
│ ┃ ┃                                                          │
│ ┃▐▌┃      gogolala                                           │
│ ┃██┃                                                          │
│ ┃▐▌┃      Youtube                                             │
│ ┃ ┃       Apple music                                         │
│ ┃▐█▌┃     Spotify                                             │
│ ┃ ┃       Tidal                                               │
│ ┃ ┃                                                          │
│ ┃ ┃       (tracks, when uploaded: listed along the track)     │
│ ↑ the optical soundtrack, printed along the film edge;         │
│   a thin bias line while silent, the live waveform when sound  │
│   is on                                                        │
└──────────────────────────────────────────────────────────────┘
```

* No tracks are hosted yet, so the page is honest about it: the four platform links from the old site *are* the room, and the soundtrack shows silence. With **소리 켜기**, the projector hum plays and its real waveform is printed on the track.
* When the owner uploads mp3/m4a files in /admin, they are listed on the track; playing one prints its waveform, the mini-player keeps it playing across pages, and on the wall the beam pulses with it.

### 4.5 About — end credits

A slow credits roll (rising ~24 px/s) the visitor can grab: scrolling, dragging or a key takes over and the roll resumes after a pause. A visible 멈춤/재생 control stops it (WCAG 2.2.2). Reduced motion: no roll.

```
┌────────────────────────────┐
│            goll             │
│        Ki Hyoung Oh         │
│                             │
│          영화감독            │
│            화가              │
│           작곡가             │
│        ┌──────────┐         │
│        │  photo   │         │
│        └──────────┘         │
│        2002 gollshow        │
│  18-2, Daehak-ro 14-gil,    │
│  Jongno-gu, Seoul,          │
│  Republic of Korea          │
│     ┌────────────────┐      │
│     │  KBS video      │      │
│     └────────────────┘      │
│     Broadcast news-KBS      │
│                             │
│     gollshow@gmail.com      │
│         Instagram           │
│             空               │
│                       멈춤  │
└────────────────────────────┘
```

Only real text: name and roles from site settings, the old About page's text exactly as written, its photo, the KBS clip and its caption, contact from settings.

### 4.6 Work page — the permalink

Each work keeps its own address (`/works/<slug>/`) for sharing and search: the same projection treatment as the viewer, rendered statically, with the caption, the process video for the three projects (lazy iframe), and the previous/next frame of its reel.

### 4.7 The opening — the one orchestrated moment

About 3 s, once per session, skippable (any key, click, scroll, or the 건너뛰기 button):

1. 0–0.6 s — the projector starts: the gate flickers on, irregular, at 18–24 fps.
2. 0.6–2.2 s — **空** (the only word on the old landing page) as a projected title card: grain, gate weave, halation.
3. 2.2–3.0 s — the card burns out and the beam opens onto the wall.

---

## 5. Motion

* **One orchestrated moment**: the opening. Everything else answers the visitor: the beam follows the pointer with a little inertia (the weight of a projector head), the wall follows the scroll, the cut is instant.
* The projection treatment (grain, weave, flicker) is continuous but sub-pixel and low-contrast; it stops when the tab is hidden.
* No fade-up reveals, no parallax decoration, no scroll-jacked text.
* **`prefers-reduced-motion: reduce`**: no opening; the wall is fully lit (no beam, no flicker, no grain); no weave or flash in the viewer; no credits roll.
* Rendering pauses when nothing changes, when the tab is hidden and while the viewer covers the wall.

## 6. Sound

Off by default. A clear **소리 켜기 / 소리 끄기** (Sound on / off) control sits in the header. With no tracks yet, sound on means a quiet synthesized projector hum (motor, fan, the 24 fps shutter flutter), so the soundtrack on the music page draws a real waveform. When a track plays, the hum steps back.

## 7. Technology

* Astro (static), Sveltia CMS at /admin, GitHub Pages: unchanged.
* The wall is real HTML: links and images at their positions (accessible, lazy-loaded with LQIP, works without JavaScript as a horizontal scroller). Light is a WebGL layer (**OGL**) composited with `mix-blend-mode: multiply` over the wall, plus a CSS haze cone in `screen`. One full-screen triangle, no textures, rendered at ≤ 1× DPR. Without WebGL the same light is drawn by a CSS radial gradient.
* Colours are sampled at build time from every image (sharp, k-means on a 48 px thumbnail) and stored with the page data. Nothing to do in /admin.
* Performance floor: Lighthouse mobile ≥ 90 on every page; textures none, images lazy with LQIP, DPR capped, rendering paused off screen.

## 8. Principles

1. **One bold place.** The wall and the beam. Every other page is black, type and the work.
2. **Only real text.** No invented titles, years, captions or credits. Untitled works are named by reel and frame.
3. **Numbers only for sequences.** Frame counters and reel positions; nothing decorative.
4. **The paintings carry the colour.** The interface has light, not colour.
5. **Structure, not ornament.** Hierarchy comes from weight, size and position, never from separators like "A · B · C", arrows on links, cards or shadows.
6. **The floor is quiet but complete.** Mobile first; visible keyboard focus (tungsten ring); `prefers-reduced-motion`; contrast AA; works without WebGL and without JavaScript; Korean first with an English mode.

---

## 9. Review of this plan against the brief

Read back against the brief and the frontend-design rules; what changed because it read generic or wrong:

| First draft | Why it was wrong | Now |
|---|---|---|
| The beam as a radial-gradient spotlight following the cursor | A generic "flashlight cursor" effect seen on many sites; nothing about a projector | Light is *multiplied* onto the paint like real light; the beam takes the colour of the lit work and spills its bounce colour onto the wall; a faint dust cone rises from the projector at the bottom centre; a 24 fps shutter flicker sits in the light |
| Works sized from their pixel dimensions | Pixel size is the size of Adobe's file, not of the painting: false "true scale" | Physical size where known (the three 2024 paintings), one neutral area otherwise; the owner's `size` entries make the wall truer over time |
| Room pages as a grid of thumbnails with a hang/index toggle (round 1) | A portfolio template with an accessory toggle | One reel per room, a gate in the middle of the screen, frame numbers on the film edge; no modes |
| Captions as `회화 · 017 · 2024 · Oil` | The "A · B · C" meta-string tell | Stacked lines in one family, weight carries the hierarchy |
| Header labels in tracked capitals (round 1 `.label`) | ALL CAPS eyebrow tell | Sentence case, Hahmlet 500, the current page lit in tungsten |
| `dust #6B6660` for secondary text | Fails AA on black (3.7 : 1) | `ash #8A847C` (5.7 : 1) for text; dust only for marks |
| Condensed Hahmlet for title cards and counters | Hahmlet has no width axis; squeezing it would fake a cut | Weight 200 at large sizes, tabular figures for counters |
| Light/dark theme toggle (round 1) | An accessory; the room is dark by definition | Removed |
| A music page with a tracklist of pill play buttons | A player template, and there are no tracks: it would be fake | The optical soundtrack + the four real platform links; tracks appear only when uploaded |
| "Scroll" cue with a moving line, "GO →" (round 1) | Decoration and the arrow tell | Removed; the beam itself invites movement |
| Fade-up reveal on every section (round 1) | Generic tell | Removed everywhere |
| Signature traced from the watercolour | The signature is ~25 px tall in the only scan; the trace came out blobby (the "o" fills in, the g's spiral is lost — see `_check/r0-signature-trace.png`) | A set wordmark, `goll` in Hahmlet 300; the traced signature can replace it when a larger scan exists |
