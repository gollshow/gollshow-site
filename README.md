# goll show: 영사실 (the projection room)

The site of **goll** (Ki Hyoung Oh): film director, painter, composer (as **gogolala**). A dark projection room: every painting hangs on one long studio wall, and the visitor's pointer is the projector's beam.

- **Live:** https://gollshow.github.io/gollshow-site/
- **Admin (upload works):** https://gollshow.github.io/gollshow-site/admin/ — how-to in Korean: **[관리자_사용법.md](./관리자_사용법.md)**
- Design concept and rules: [DESIGN.md](./DESIGN.md). Import from the old site: [IMPORT_REPORT.md](./IMPORT_REPORT.md). QA rounds, screenshots and Lighthouse: [`_check/README.md`](./_check/README.md)

Built with [Astro](https://astro.build) (static output), [Sveltia CMS](https://sveltiacms.app) (Git-based admin, sign-in with a GitHub token), hosted on GitHub Pages. The beam is a WebGL layer ([OGL](https://github.com/oframe/ogl)), loaded on the visitor's first interaction, with a CSS fallback. Fonts: Hahmlet (wght 200 and 400) and Noto Serif KR for the few glyphs Hahmlet lacks (空, ㎜), both SIL OFL, self-hosted and subset at build time.

---

## How updates reach the site

```
/admin  ──Save──▶  commit to main  ──▶  GitHub Action "Deploy to GitHub Pages"  ──▶  gh-pages branch  ──▶  live (≈ 2–5 min)
```

- Every push to `main` builds the site (`npm run build`) and publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves. The workflow then fetches the live URL to confirm the new build is online.
- Progress: https://github.com/gollshow/gollshow-site/actions

## Content model

| Where | What |
|---|---|
| `src/content/works/*.md` | one file per work: `title` (optional: untitled works are shown by reel and frame, e.g. 회화 017 / 066), `title_en`, `year`, `category` (`painting`, `conte-pastel`, `digital`, `music`, `film`, `etc`), `medium`, `medium_en`, `size` (parsed to millimetres for the wall's true scale), `images` (list, the first hangs on the wall), `cover` (share image), `description`, `description_en`, `audio` (mp3/m4a), `link`, `video` (embed or YouTube/Vimeo URL), `order`, `draft` |
| `src/content/pages/about.md` | the end credits: `bio` (text, line breaks kept), `portrait`, `video`, `video_caption`, CV list |
| `src/content/pages/music.md` | the music room: `name` (gogolala) and platform `links` |
| `src/content/settings/site.yml` | site title, name, roles, contact, links |
| `src/assets/media/` | all images (the build makes AVIF/WebP in up to 5 widths, an LQIP and the sampled colours) |
| `public/media/audio/` | uploaded tracks (played by the persistent mini-player) |

Colours for the beam (each work's dominant and most saturated colour) are sampled from the images at build time (`src/lib/palette.ts`, cached in `.cache/palette.json`). Nothing to enter in /admin.

## Develop locally

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:4321/gollshow-site/. For a production build, run `npm run build` (output in `dist/`), then `npm run preview`.

QA screenshots of every page type at 1440×900 and 390×844: `node scripts/qa/shoot.mjs <prefix>` against a running preview (writes to `_check/`).

---

## Moving the domain gollshow.com to this site

The site is served at `gollshow.github.io/gollshow-site` until you switch. Do the steps **in this order**, ideally in one sitting. Expect a short gap (minutes to a few hours) while DNS updates.

### 1. Disconnect the domain from Adobe Portfolio
Adobe Portfolio → **Edit your site** → **Settings** (gear) → **Domain Name** → remove / disconnect `gollshow.com` (and `www.gollshow.com`). Keep your Adobe account if you like; the old site stays reachable at its `*.myportfolio.com` address.

### 2. Change the DNS records at your domain registrar
Delete the records that point to Adobe (usually an `A` record to Adobe IPs and/or a `CNAME` for `www` ending in `myportfolio.com`), then add:

| Type | Name / Host | Value |
|---|---|---|
| `A` | `@` (gollshow.com) | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `AAAA` (optional, IPv6) | `@` | `2606:50c0:8000::153` |
| `AAAA` (optional) | `@` | `2606:50c0:8001::153` |
| `AAAA` (optional) | `@` | `2606:50c0:8002::153` |
| `AAAA` (optional) | `@` | `2606:50c0:8003::153` |
| `CNAME` | `www` | `gollshow.github.io` |

(Recommended, against domain takeover: GitHub → your profile **Settings** → **Pages** → **Add a domain** → `gollshow.com` → add the `TXT` record it shows, then **Verify**.)

### 3. Flip the one-line switch in this repository
In [`site.config.mjs`](./site.config.mjs) change

```js
export const CUSTOM_DOMAIN = '';
```

to

```js
export const CUSTOM_DOMAIN = 'gollshow.com';
```

and commit to `main` (on GitHub: open the file → pencil icon → edit → **Commit changes**). The build then uses `https://gollshow.com` as its address with no `/gollshow-site` prefix, writes the `CNAME` file GitHub Pages needs, and points the admin, sitemap and social previews at the new domain.

### 4. Turn on HTTPS
Repository **Settings → Pages**: the custom domain shows `gollshow.com` and, once DNS has propagated, "DNS check successful". Tick **Enforce HTTPS** (the certificate can take up to an hour to be issued; the box is greyed out until then).

Old Adobe addresses keep working: `/work`, `/home`, `/picture`, `/ttt`, `/contepastel`, `/music-1`, `/test`, `/yyy`, `/uuu` and `/willow-and-water-lily` redirect to the wall, the reels and the works. (`/digital` is the same address on both sites.)

The admin then lives at **https://gollshow.com/admin/**. Your GitHub token keeps working.

---

## Repository map

```
site.config.mjs          domain switch (one line)
astro.config.mjs         Astro config, redirects from old Adobe URLs, sitemap
src/content.config.ts    content schema (tolerant of empty CMS fields; title optional)
src/pages/               / (the wall) · /<reel>/ · /works/<slug>/ · /music/ · /about/ (credits) · /admin/ · /og/<slug>.jpg
src/components/          Header, Wall, Opening (空 title card), Viewer (projection), Player, Embed, T, Para
src/scripts/             wall.ts (travel, beam, framing), light.ts (OGL shader), opening.ts, viewer.ts, reel.ts,
                         sound.ts (projector hum, analyser), soundtrack.ts (optical track), player.ts, credits.ts, grain.ts
src/lib/                 wall.ts (the hang, in millimetres), size.ts, palette.ts, works.ts, media/pic (images + LQIP), seo, i18n
scripts/fonts.mjs        font subsetting (runs after every build)  ·  scripts/fonts/  Hahmlet (OFL)
scripts/plaster.mjs      the wall's plaster texture  ·  scripts/glyph.mjs  空 outline + favicons
scripts/import/          from-data.mjs (round 2 import), from-pages.mjs (saved Adobe pages), crawl.mjs
scripts/qa/shoot.mjs     QA screenshots
.github/workflows/       deploy.yml (Pages + live check), import-old-site.yml (importer)
```
