# Import report — gollshow.com (Adobe Portfolio) → this site

_Run on 2026-11-02 from a Claude Code cloud session._

## Summary

| | |
|---|---|
| Pages on the old site (from its sitemap) | 12 |
| Pages whose content could be read | **1** (the landing page, via the Internet Archive) |
| Work images imported | **1** (the watercolour on the landing page — now the opening image) |
| Works created | 0 — every room currently shows its quiet "empty room" state |

**Why so little:** gollshow.com answers **HTTP 403** to every automated request. It refused this session's network and a GitHub Actions runner alike, even with an honest user agent. Adobe Portfolio blocks automated visitors, and I did not try to get around that protection. The Internet Archive (Wayback Machine) holds only the landing page and the sitemap (snapshot of 2025-07-11). The category and project pages were never archived. The image CDN itself (`cdn.myportfolio.com`) *does* answer GitHub runners, so the only missing piece is the page HTML that lists which images exist.

## What was imported (text exactly as written)

From `https://gollshow.com/` (Wayback snapshot `20250711212909`):

- Site title: **goll show** → `site_title` in *사이트 설정*
- The single character **空** → the identity and opening of the new site
- The image on the landing page (watercolour, signed "goll"). Downloaded as the **original** file from `cdn.myportfolio.com/ed5a85f2-…/289295ec-ea42-4f63-9a62-929df5e59d23.jpg`. Adobe only stored it at **472 × 691 px**, so it is small. Saved as `src/assets/media/goll-landing-watercolor.jpg` and used as the opening image until works marked *대표작* exist. **Please upload a larger scan if you have one.**
- Button **GO** → `/work` (kept: the opening has a "GO →" link to the works)
- Instagram `https://www.instagram.com/gollshow/` and e-mail `gollshow@gmail.com`

From the brief (owner-supplied, the `/work` page): **"Hi, I'm goll !"** → the greeting under the opening.

## What is missing — every page except the landing

| Old address | Contents (from the sitemap / brief) | New address (old one redirects) |
|---|---|---|
| `/work` | "Hi, I'm goll !" + 4 category tiles | `/works/` |
| `/picture`, `/ttt` | Painting | `/painting/` |
| `/contepastel` | conté / pastel | `/conte-pastel/` |
| `/digital` | digital | `/digital/` |
| `/music-1`, `/music` | Music | `/music/` |
| `/test` | About | `/about/` |
| `/home`, `/yyy`, `/uuu`, `/willow-and-water-lily` | unknown (listed in the sitemap only) | `/` or `/works/` |

All titles, years, media, captions, descriptions, about-text and music links on those pages are missing. **Nothing was invented.** The rooms are empty and the About page shows only what is known (name, roles, contact).

Also not imported (deliberately): older, unrelated versions of gollshow.com that the Internet Archive holds from 2002–2015 (a personal homepage with a message board, and a Cafe24 shop). Nothing related to 「귀행자」 was found or imported. The importer skips it automatically.

## How to fill the gaps (pick one)

1. **Upload works yourself in `/admin`** — see [`관리자_사용법.md`](./관리자_사용법.md). Best quality, because you can use your original scans instead of Adobe's resized copies.
2. **Save the old pages and let the importer do it** — about 10 minutes of clicking, no typing:
   open each old page in your browser → *Save Page As… → "Webpage, HTML only"* → upload the `.html` files to [`_import/inbox/`](./_import/inbox/) on GitHub. The workflow **Import old site pages** then downloads every image at its largest size from Adobe's CDN, keeps titles, years and captions exactly as written, creates the works, and redeploys. Step-by-step in Korean: [`_import/inbox/README.md`](./_import/inbox/README.md). Results are written to `_import/last-run.md`.
3. **Let a Claude session crawl it** — allow `gollshow.com` and `cdn.myportfolio.com` in the cloud environment's *Network access* settings and ask again. (This may still fail if Adobe also refuses that network.) You can also run the importer workflow by hand with *crawl* ticked (Actions → Import old site pages → Run workflow).

## Technical log

- Live site: `403` for `/`, `/work`, `/music-1`, `/picture`, `/ttt`, `/contepastel`, `/digital`, `/test`, `/sitemap.xml` (GitHub Actions runner, 2026-11-02 20:28 and 20:36 UTC).
- Wayback CDX `gollshow.com/*`: 205 URLs, of which Adobe-Portfolio-era HTML only `/` and `/sitemap.xml`.
- CDN: original of the landing image fetched live (`200`, 36,891 bytes, 472×691).
- The raw snapshot used for this report is on the branch `import-data`. It is temporary and safe to delete.
