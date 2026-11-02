# goll show — 空

The portfolio of **goll** (Ki Hyoung Oh): film director, painter, composer.

- **Live:** https://gollshow.github.io/gollshow-site/
- **Admin (upload works):** https://gollshow.github.io/gollshow-site/admin/ — how-to in Korean: **[관리자_사용법.md](./관리자_사용법.md)**
- Design concept and rules: [DESIGN.md](./DESIGN.md) · Import status from the old site: [IMPORT_REPORT.md](./IMPORT_REPORT.md) · QA screenshots: [`_check/`](./_check/)

Built with [Astro](https://astro.build) (static output), [Sveltia CMS](https://sveltiacms.app) (Git-based admin, sign-in with a GitHub token), hosted on GitHub Pages. Fonts: Noto Serif KR and Pretendard (both SIL OFL), self-hosted and subset at build time.

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
| `src/content/works/*.md` | one file per work: `title`, `title_en`, `year`, `category` (`painting` · `conte-pastel` · `digital` · `music` · `film` · `etc`), `medium`, `medium_en`, `size`, `images` (list, ordered), `cover`, `description`, `description_en`, `audio`, `link`, `featured`, `order`, `draft` |
| `src/content/pages/about.md` | bio KO/EN, portrait, CV list |
| `src/content/settings/site.yml` | site title, name, roles, greeting, contact, links |
| `src/assets/media/` | all uploaded images (the build makes AVIF/WebP in 5 widths + blurred placeholders) |
| `public/media/audio/` | uploaded music files (played by the persistent mini-player) |

## Develop locally

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:4321/gollshow-site/. For a production build, run `npm run build` (output in `dist/`), then `npm run preview`.

`node scripts/demo.mjs` writes git-ignored demo works for layout testing; `node scripts/demo.mjs --clean` removes them.

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

Old Adobe addresses keep working: `/work`, `/picture`, `/ttt`, `/contepastel`, `/digital`, `/music-1`, `/test`, `/home` redirect to their new rooms.

The admin then lives at **https://gollshow.com/admin/**. Your GitHub token keeps working.

---

## Repository map

```
site.config.mjs          domain switch (one line)
astro.config.mjs         Astro config, redirects from old URLs, sitemap
src/content.config.ts    content schema (tolerant of empty CMS fields)
src/pages/               routes: / · /works/ · /<room>/ · /works/<slug>/ · /music/ · /about/ · /admin/ · /og/<slug>.jpg
src/components/          Header, Footer, Hang (curated layout), Art (responsive image), Viewer, Player, Kong (空)
src/scripts/             kong.ts (opening), viewer.ts, player.ts, chrome.ts, prefs.ts
src/lib/                 media/pic (images + LQIP), hang (layout rhythm), works, seo, i18n
scripts/fonts.mjs        font subsetting (runs after every build)
scripts/glyph.mjs        extracts 空 from Noto Serif KR → src/generated/kong.json + favicons
scripts/import/          importer for saved Adobe Portfolio pages (see IMPORT_REPORT.md)
.github/workflows/       deploy.yml (Pages), import-old-site.yml (importer)
```
