# gollshow

The site of **goll** (Ki Hyoung Oh): film director, painter, composer (as **gogolala**).

- **Live:** https://gollshow.github.io/gollshow-site/
- **Admin:** https://gollshow.github.io/gollshow-site/admin/ — how to use it, in Korean: **[docs/관리자-사용법.md](./docs/관리자-사용법.md)**
- Design rules for this round: [DESIGN.md](./DESIGN.md)

Built with [Astro](https://astro.build) (static output) and [Sveltia CMS](https://sveltiacms.app) (Git-based admin, sign-in with a GitHub token), hosted on GitHub Pages.

## What it looks like (round 3)

- **Home** — a WebGL pigment flow: four pigments (set in /admin → 사이트 설정) swirl and settle while the wordmark gathers out of them as ink. The pointer stirs the pigment. No artwork on this screen. Code: `src/scripts/hero.ts`.
- **Ground** — every visit opens on white paper (`#F2F0EB`, ink `#1E1D1B`) or black (`#0C0C0D`, ink `#ECE9E2`), picked once per browser session; `?bg=white` or `?bg=black` forces one. Colour lives only in the pigment and the paintings.
- **Language** — English by default; **KR** switches every label and every text that has a Korean version, and the browser remembers it.
- **Painting / Conté & Pastel / Digital** — hung like the spreads of an art book (`src/lib/hang.ts`): an L work gets a row to itself with a wall label beside it; the rest come in stepped pairs and trios. S/M/L is set per work in /admin. Click a work for the full-screen viewer (ink-bleed reveal, ←/→, swipe, Esc, "12 / 63", a **Process** button when there is a process video). Images are never shown larger than 1.5× their natural size.
- **Film** — one film per row (2.39:1 still, titles, year, role, runtime, logline) and a page per film (trailer as a lite embed, synopsis, stills, credits, festivals, links). Until a film is published the page says "Films are on their way." An unpublished example entry shows how to fill one in (visible in `npm run dev` only).
- **Inner pages** open with a watercolour wash across the top in the same four pigments, the page name written in ink (`src/scripts/band.ts`); it settles in ~2.4 s and stops, so the works below sit on a calm ground.
- **Music** and **About** — gogolala's platforms (Spotify as a click-to-load player); the bio, the record, the three practices, the KBS clip, contact.
- Page changes use one ink-wash transition (View Transitions API with a noise mask, `public/fx/wash.webp`).

## How updates reach the site

```
/admin  ──Save──▶  commit to main  ──▶  GitHub Action "Deploy to GitHub Pages"  ──▶  gh-pages branch  ──▶  live (≈ 2–5 min)
```

Every push to `main` builds the site (`npm run build`) and publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves, then checks the live URL. Progress: https://github.com/gollshow/gollshow-site/actions

## Content model

| Where | What |
|---|---|
| `src/content/art/painting.yml`, `conte-pastel.yml`, `digital.yml` | one file per category: `works` (list, in display order) with `image`, `title_en`, `title_ko`, `year`, `material`, `size`, `note`, `display` (S/M/L), `hidden`, `process` (video URL); `bulk` is the admin's "drop many images" field — the admin's save hook moves those into `works`, and the build shows anything left there too |
| `src/content/films/*.md` | one file per film: `published`, titles, `year`, `runtime`, `role_*`, `logline_*`, `still` + `focus`, `trailer`, `synopsis_*`, `stills`, `credits`, `festivals`, `links`, `order` |
| `src/content/pages/about.md`, `music.md` | About (heading, statement, bio, poster, three practices, record, video, address — all EN/KR) and Music (name, platform links) |
| `src/content/settings/site.yml` | wordmark, the four pigment colours, menu labels EN/KR, contact and links, names, SEO text |
| `src/assets/media/` | all images (the build makes WebP sizes up to the original's width) |

The wordmark font is set in ONE place: `--f-mark` in `src/styles/global.css` (the home motion's text canvas reads it from there). It is Instrument Serif for now.

## Develop locally

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:4321/gollshow-site/. Production build: `npm run build` (output in `dist/`), then `npm run preview`.

QA screenshots of every page type: `node scripts/qa/shots.mjs http://localhost:4321/gollshow-site/ _check` against a running dev server or preview. `node scripts/fx.mjs` regenerates the wash mask and the favicons.

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

Old Adobe addresses keep working: `/work`, `/home`, `/picture`, `/ttt`, `/contepastel`, `/music-1`, `/test`, `/yyy`, `/uuu` and `/willow-and-water-lily` redirect to the matching pages. (`/digital` is the same address on both sites.)

The admin then lives at **https://gollshow.com/admin/**. Your GitHub token keeps working.

---

## Repository map

```
site.config.mjs            domain switch (one line)
astro.config.mjs           Astro config, redirects from old addresses, sitemap
src/content.config.ts      content schema (tolerant of empty CMS fields)
src/pages/                 / (pigment) · /painting/ /conte-pastel/ /digital/ · /film/ · /film/<slug>/ · /music/ · /about/ · /admin/
src/layouts/Base.astro     head, ground + language pick, page transition
src/components/            Top (menu), Viewer, Lite (click-to-load embeds), T (EN/KR text)
src/scripts/               hero.ts (WebGL pigment), viewer.ts, chrome.ts (KR/EN switch, mobile menu)
src/lib/                   site.ts (settings, menu, UI words), art.ts, media.ts (images), embed.ts
src/pages/admin/           Sveltia CMS page (+ the save hook) and its generated config
docs/관리자-사용법.md        admin guide (Korean)
scripts/fx.mjs             wash mask sprite + favicons · scripts/qa/  screenshots and the live check
.github/workflows/         deploy.yml (Pages + live check), live-check.yml (browser check of the live site, by hand)
```
