# QA: 영사실 (round 2 redesign)

## 한국어 요약 (주인께)

**무엇이 보이나요**
- 첫 화면은 **불 꺼진 영사실의 벽**입니다. 옛 사이트의 그림 **116점**(회화 66, 콩테·파스텔 37, 디지털 13)이 모두 한 벽에 걸려 있고, 마우스가 **영사기 빛**입니다. 빛이 닿는 그림만 보이고, 빛은 그 그림의 색을 띱니다. 빛이 그림 위에 멈추면 갤러리의 프레이밍 조명처럼 **그림의 테두리에 맞춰 모입니다**. 스크롤하거나 끌면 벽을 따라 걷습니다. 휴대전화에서는 빛이 화면 가운데에 있고 벽이 움직입니다.
- 처음 들어오면 약 3초 동안 영사기가 켜지며 옛 첫 화면의 글자 **空**이 타이틀 카드로 비칩니다 (창마다 한 번, 누르면 건너뜀).
- 그림을 누르면 화면 가득 **영사**됩니다 (필름 입자, 미세한 흔들림, 빛 번짐). ← → 또는 옆으로 밀면 필름을 잇듯 다음 그림으로 끊어 넘어갑니다. `017 / 066` 같은 번호는 릴 안의 순서입니다.
- **회화 · 콩테·파스텔 · 디지털**은 각각 하나의 **릴(필름)** 입니다. 화면 가운데(게이트)를 지나는 프레임만 밝습니다.
- **음악**: gogolala와 네 개의 링크(Youtube, Apple music, Spotify, Tidal). 왼쪽 띠는 필름 가장자리의 **사운드트랙**이고, "소리 켜기"를 누르면 지금 들리는 소리가 새겨집니다.
- **소개**: 영화의 **엔딩 크레딧**처럼 천천히 올라갑니다 (사진, 옛 소개 글 그대로, KBS 뉴스 영상과 "Broadcast news-KBS").
- 제목이 없는 그림은 제목을 지어내지 않고 "회화 017"처럼 릴과 순서로만 표시합니다. 2024년 세 작품(gogo, Pear blossom, willow and water lily)은 원래 적힌 크기·재료 그대로이고, 작업 과정 영상이 작품 페이지에 있습니다.

**주인의 원본이나 음원이 필요한 것**
- **원본 스캔**: 대부분의 그림이 Adobe가 만든 작은 사본(긴 변 600~750px)입니다. 원본 파일이 있으면 /admin에서 그 작품의 이미지만 바꾸면 모든 화면이 선명해집니다.
- **실제 크기**: 크기를 아는 작품은 /admin의 "크기"에 넣어 주세요. 벽에서 실제 비율로 걸립니다. 지금은 2024년 세 작품만 실제 크기입니다.
- **가져오지 못한 두 장**: 콩테·파스텔 22번째, 디지털 4번째 그림. 받은 주소의 해시가 맞지 않아 Adobe가 거부했습니다(아래 표). 대신 넣은 것은 없습니다.
- **음원 파일**: 아직 하나도 없습니다. MP3/M4A를 올리면 음악 페이지에 곡이 생기고, 사운드트랙에 파형이 새겨지며, 벽의 빛이 음악에 맞춰 맥박 칩니다.
- **영상**: 작업 과정 영상 셋과 KBS 영상은 Adobe 계정에 달려 있습니다. 계정을 닫기 전에 YouTube/Vimeo로 옮기고 주소를 바꿔 주세요.
- 서명 "goll": 옛 수채화 속 서명이 너무 작아(약 25px) 깨끗한 SVG가 나오지 않았습니다(`r0-signature-trace.png`). 지금은 글자로 쓴 goll입니다. 큰 스캔이 있으면 서명 로고로 바꿀 수 있습니다.

**바꾸는 법 (/admin)**: 관리자 주소에서 GitHub 토큰으로 로그인합니다. 작품마다 **제목(선택), 크기, 재료, 영상, 순서**를 바꿀 수 있습니다. **음악 페이지**에서는 플랫폼 링크를, **소개 페이지**에서는 사진·글·영상·캡션을 바꿉니다. 빛의 색은 그림에서 자동으로 뽑습니다. 저장하면 2~5분 뒤 사이트에 반영됩니다. 자세한 내용은 [`../관리자_사용법.md`](../관리자_사용법.md)에 있습니다.

---

## How the checks were run

- Production build served by `astro preview`; screenshots by [`scripts/qa/shoot.mjs`](../scripts/qa/shoot.mjs) in the cloud's Chromium (software WebGL), **desktop 1440×900** and **mobile 390×844 @2×**, Korean unless noted. CSS animations are frozen at given moments for the opening shots, so slow software rendering cannot shift the timing.
- Lighthouse 12, mobile emulation (simulated slow 4G, 4× CPU), same build.
- Live check in a real browser on a GitHub Actions runner: [`scripts/qa/live.mjs`](../scripts/qa/live.mjs), workflow *Live check*. Results are pushed to the `live-check` branch. See *Live site* below.

| # | View | Files (`r1-`, `r2-`, `r3-` = round) |
|---|---|---|
| 01 | Opening: flicker, 空 title card, burn-out | `*-01a-opening-flicker`, `*-01b-opening-title-card`, `*-01c-opening-burn` |
| 02–04 | The wall: start, travelling, the 콩테·파스텔 reel on the wall | `*-02-wall-start`, `*-03-wall-travel`, `*-04-wall-conte` |
| 05 | Projection (viewer), and after → | `*-05-viewer`, `*-05b-viewer-next` |
| 06 | Reel (회화) | `*-06-reel`, `*-06b-reel-scrolled` |
| 07 | Work page, titled and untitled | `*-07-work`, `*-07b-work-untitled` |
| 08 | Music, silent and with sound on (projector hum printed on the track) | `*-08-music`, `*-08b-music-sound-on` |
| 09 | About: the credits roll | `*-09a-credits-start`, `*-09b-credits`, `*-09c-credits-video` |
| 10–11 | 404, mobile menu | `*-10-404`, `r*-mobile-11-menu` |
| 12 | English mode | `*-12-work-en` |
| 13 | Reduced motion: the room lights on, no beam, no grain | `*-13-reduced-motion` |
| 14–15 | Keyboard focus moving the beam; a QA-only test tone in the player and soundtrack (not site content) | `r3-desktop-14-keyboard-focus`, `r3-desktop-15-player-soundtrack` |

Partial reshoots after fixes: `r2b-*` (framing beam), `r3b-*` (opening burn, caption), `r3c-*` (work-page layout). Round 1's rejected design is archived in [`round1/`](./round1/). The `*-errors.txt` files log browser errors per round: only the deliberate 404 page.

In the sandbox the third-party players (Adobe video, the CMS script) could not load, so iframes show white there. That is a network limit of the sandbox, not of the site.

## Round 1 → 2

- **Bug**: the light canvas was stuck at 300×150 px (OGL sets an inline size on creation). The canvas is now sized from the stage.
- **Performance**: the page blocked the main thread for about 7 s in GPU-less Chrome. Causes: the plaster texture, an SVG turbulence filter rasterized on the main thread (1.2 s on mobile alone); a full-resolution shader redrawn 24 times a second; a dust animation that repainted every frame. Now: a pre-rendered 384 px plaster tile (`scripts/plaster.mjs`), the light rendered at about 0.25 MP and upscaled, a 12 fps shutter flicker, and WebGL started at the visitor's first interaction (a CSS light holds the room until then).
- **Removed accessory: the haze cone.** A dusty cone from the projector to the spot read as a flat grey triangle with a halftone grid.
- The opening's gate read as a CRT television (a big rounded rectangle, heavy grain). It is now smaller, with soft projected edges and less grain.
- Mobile: the first beam lit empty plaster. The lead-in is now sized to the room name painted on the wall.
- The viewer opened with a focus box drawn on 닫기. The projection screen now takes focus.
- Reel: tungsten-lit sprocket holes looked like film-strip clip-art. The holes are now small and dim, with only a warm glimmer at the gate.
- The header overlapped reel and music content. It now has a black ground on every page except the wall.
- The work-page caption was cut below the fold, and untitled works showed "회화 020" twice.
- Iframes were white before loading. They are now dark.
- Music: on mobile the soundtrack ran under the wordmark, and the hum printed too faintly.
- The plaster was too blotchy when fully lit (reduced motion).

## Round 2 → 3

- **Removed accessory: the drop shadow under every painting.**
- The opening card's corners interpolated into a stadium shape (border-radius was not pinned in the hold keyframes).
- Mobile: the room name sat under the beam instead of in it. It is now painted at the eye line, so the first beam lands on 「회화」.
- **The beam was a plain disc.** When it rests on a work, the shutters now close onto the canvas, like a gallery's framing projector, and the painting glows inside a soft rectangle (`r2b-desktop-03-wall-travel`). The disc returns when the beam moves.
- Mobile: the wall stopped between works. Native snap points now let a column settle under the fixed beam.
- **Lighthouse on the wall: 82**, with a simulated LCP of 3.7 s: about 330 KB of paintings, plaster and fonts were requested before first paint. Wall image sources are now attached just after first paint (a `<noscript>` image remains for visitors without JavaScript). OGL loads on first interaction. Static Hahmlet 200 and 400 (34 + 33 KB) replace the variable font (82 KB). Grain is drawn when the page is idle. **Result: 97–98.**
- Reel: the 10 px edge numbers failed *legible font sizes*, so the edge print is now CSS decoration (the caption carries the number as text). The mobile caption caused CLS 0.047 and now has a fixed height.

## Round 3 → final

- **Removed accessory: the caption that named the room when the beam is on bare wall.** The reel line at the bottom already shows where you are.
- The opening's burn-out read as a matte beige card. It is now a screen-blended tungsten flash with a hot centre.
- The work-page caption still clipped at 900 px. The caption box is taller and the leading tighter.
- Work pages downloaded the main image twice: the halation copy fetched a 196 KB file. It now uses the smallest variant, and the frame is sized from the image ratio before the file arrives (CLS 0.30 → 0.002 on large pastels).
- Reel edge print raised to 12 px (it still failed *legible font sizes* at 11 px as CSS text); reels 94–96 → 99.
- Functional checks (`r3-desktop-14`, `-15`): Tab moves the beam from work to work and the wall travels to it; Enter projects the work; → advances; Esc returns focus to the work. A test tone plays through the mini-player, prints its waveform on the soundtrack, and keeps playing after navigating to the wall. No browser errors.

## Lighthouse (mobile, final build)

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` (the wall) | 97 | 100 | 100 | 100 | 2.2 s | 20 ms | 0.000 |
| `/painting/` | 99 | 100 | 100 | 100 | 2.2 s | 0 ms | 0.022 |
| `/conte-pastel/` | 99 | 100 | 100 | 100 | 2.2 s | 0 ms | 0.001 |
| `/digital/` | 99 | 100 | 100 | 100 | 2.2 s | 0 ms | 0.001 |
| `/works/gogo/` | 99 | 100 | 100 | 100 | 1.8 s | 0 ms | 0.003 |
| `/works/painting-017/` (untitled) | 100 | 100 | 100 | 100 | 1.7 s | 0 ms | 0.003 |
| `/works/conte-pastel-014/` (1920×2560) | 96 | 100 | 100 | 100 | 2.7 s | 12 ms | 0.002 |
| `/works/willow-and-water-lily/` (4K) | 95 | 100 | 100 | 100 | 2.9 s | 0 ms | 0.003 |
| `/music/` | 100 | 100 | 100 | 100 | 1.5 s | 0 ms | 0.004 |
| `/about/` | 100 | 100 | 100 | 100 | 1.6 s | 0 ms | 0.001 |

The reels scored 94–95 with best practices 96 until the edge print went from 10–11 px to 12 px (*legible font sizes* counts CSS-generated text too). The 404 page returns status 404, which Lighthouse does not audit.

## Import failures (from [`../_import/round2-report.md`](../_import/round2-report.md))

| Old page, position | Expected | Result |
|---|---|---|
| `/contepastel`, 22nd image (`51ed8304-…_rw_600.jpg`) | 600×374 | HTTP 403 from cdn.myportfolio.com |
| `/digital`, 4th image (`64470cf1-…_rw_600.jpg`) | 600×751 | HTTP 403 from cdn.myportfolio.com |

All other 118 images downloaded with exactly the listed pixel size. No replacement was guessed. Details in [`../IMPORT_REPORT.md`](../IMPORT_REPORT.md).

## Live site

See the end of this file, added after the deploy.
