# Import report: gollshow.com (Adobe Portfolio) → this site

## Round 2 (2026-11-03): the real works are in

Source: the old site's data, fetched by the owner on their own PC (Adobe refuses cloud networks), saved verbatim in [`_import/adobe-2026-11-03.txt`](./_import/adobe-2026-11-03.txt). The cloud session could not reach `cdn.myportfolio.com` either, so [`scripts/import/from-data.mjs`](./scripts/import/from-data.mjs) ran on a GitHub Actions runner. It fetched every image with its `?h=` hash exactly as listed, checked the pixel size against the data, and kept each file byte for byte (no re-encoding, no upscaling). Full per-image log: [`_import/round2-report.md`](./_import/round2-report.md).

| | Listed | Imported | Failed |
|---|---|---|---|
| 회화 grid (`/picture`) | 63 | 63 | 0 |
| 콩테·파스텔 grid (`/contepastel`) | 38 | 37 | 1 |
| 디지털 grid (`/digital`) | 14 | 13 | 1 |
| Projects (`/yyy`, `/uuu`, `/willow-and-water-lily`): covers + images | 4 | 4 | 0 |
| About photo (`/test`) | 1 | 1 | 0 |
| **Images** | **120** | **118** | **2** |

### Failures (not replaced, nothing guessed)
| Old page, grid position | URL in the data | Result |
|---|---|---|
| `/contepastel`, 22nd image | `…/51ed8304-fbce-4c6d-a327-6dab5c1addac_rw_600.jpg?h=29d3d8dcb2b6812cd295c852c092e668` (600×374) | HTTP 403 |
| `/digital`, 4th image | `…/64470cf1-3e28-4e73-b32e-2ff939c611fc_rw_600.jpg?h=41dab822f7b85423bdbdb2bd9fff83c9` (600×751) | HTTP 403 |

The CDN answers 403 when a hash does not match its file. Two signs suggest these two lines were garbled on the way: the second one's hash is identical to that of `/contepastel` image 31 (`1ca39566…`), and the first one's file id ends exactly like `/picture` image 26 (`6692253b-99cc-4f6d-a327-6dab5c1addac`). No work was created for them. Re-copying those two lines from the old site, or uploading the originals in /admin (category 콩테·파스텔 with order `122`, or 디지털 with order `104`), puts them back in their places.

### What was created
- **116 public works**, one per image, in grid order (`order` 101, 102 …). The grid had no titles, so **these works have no `title` and no `year`**. The site shows them by reel and frame (e.g. 회화 017 / 066). Files: `src/content/works/<room>-<NNN>.md`, images in `src/assets/media/<room>/`.
- **The three 2024 projects** in the 회화 reel, first (order 1–3), with their text exactly as written, split into `size` and `medium`; the site joins them back with one space:
  - `gogo`: `1200x870mm` + `Oil`, cover (3:4 crop, 481×642) and the image on its page (500×642, which hangs on the wall), process video
  - `Pear blossom`: `530X455mm` + `Oil on canvas`, cover only (3789×5052), process video
  - `willow and water lily`: `596×896㎜` + `Acrylic on canvas`, cover only (4191×5588), process video
  - `year: "2024"` from the old covers. The videos are Adobe CCV player embeds (`www-ccv.adobe.io`) and depend on the owner's Adobe account.
- **Music page** (`src/content/pages/music.md`): name `gogolala` and the four buttons with their labels exactly as written (`Youtube`, `Apple music`, `Spotify`, `Tidal`). The data wrote the YouTube handle with a full-width `＠` (U+FF20); the link is stored with the ASCII `@` that YouTube handles use (`https://www.youtube.com/@gogolalashow`). No audio files existed on the old site.
- **About page** (`src/content/pages/about.md`): the photo (421×596), the text `2002 gollshow` / `18-2, Daehak-ro 14-gil, Jongno-gu, Seoul, Republic of Korea` exactly as written, the KBS news video (Adobe embed) and its caption `Broadcast news-KBS`.
- Nothing about 「귀행자」 was in the data; nothing was imported or written about it.

### Image sizes
Most grid images are what Adobe served for its grid: the long side is about 600–750 px. They are not upscaled or "enhanced". The site is designed for this: the wall shows them small and lit, the projection view adds film grain and halation. Uploading original scans in /admin (same work, replace the image) improves every view automatically. The 콩테·파스텔 portraits (1920×2560 and larger) and the two 4K project covers are the sharpest files.

### Old addresses
`/picture` and `/ttt` go to `/painting/`, `/contepastel` to `/conte-pastel/`, `/music-1` to `/music/` and `/test` to `/about/`. `/yyy`, `/uuu` and `/willow-and-water-lily` go to their works, and `/work`, `/works` and `/home` go to the wall (`/`).

### The importers
- `scripts/import/from-data.mjs`: the one-off importer for a data file like the one above (idempotent: it never overwrites existing files).
- `scripts/import/from-pages.mjs`: the importer for saved Adobe pages (workflow *Import old site pages*). Fixed in round 2: it creates `src/content/works` when missing, ignores the "other projects" cover tiles in every project page's footer, reads works from media modules and `media_collection` grids, and creates untitled grid images as public works instead of hidden drafts.

---

## Round 1 (2026-11-02)

Adobe Portfolio answered HTTP 403 to every automated request (this cloud network and a GitHub Actions runner alike), and the Internet Archive held only the landing page. Round 1 therefore imported only the landing watercolour (`src/assets/media/goll-landing-watercolor.jpg`, 472×691, signed "goll"), the site title "goll show", the single character 空 and the contact details. Round 2 keeps that image in the media library (it is not one of the room grids, so it is not on the wall); the 空 is now the opening title card.
