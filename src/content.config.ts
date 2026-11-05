import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Text fields written by the CMS may be missing, null or "" – normalise to string|undefined. */
const text = () =>
  z
    .union([z.string(), z.number()])
    .nullish()
    .transform((v) => (v === null || v === undefined || String(v).trim() === '' ? undefined : String(v).trim()));

const bool = (d = false) => z.boolean().nullish().transform((v) => v ?? d);

const strings = () =>
  z
    .union([z.array(z.union([z.string(), z.number()]).nullish()), z.string()])
    .nullish()
    .transform((v) =>
      (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\n|,/) : [])
        .map((s) => (s === null || s === undefined ? '' : String(s).trim()))
        .filter(Boolean),
    );

const links = () =>
  z
    .array(z.object({ label: text(), url: text() }).nullish())
    .nullish()
    .transform((v) => (v ?? []).filter((l): l is { label?: string; url: string } => !!l?.url));

/* ── Painting / Conté & Pastel / Digital ─────────────────────────────────────
 * One YAML file per category (src/content/art/<category>.yml) holding the list
 * of works in display order. `bulk` is the CMS's "drop many images" field: the
 * admin moves those images into `works` on save; anything left there is still
 * shown (after the listed works) so an upload is never lost. */
export const ART = ['painting', 'conte-pastel', 'digital'] as const;

const work = z.object({
  image: text(),
  title_en: text(),
  title_ko: text(),
  year: text(),
  material: text(),
  size: text(),
  note: text(),
  display: z
    .string()
    .nullish()
    .transform((v) => (v ?? 'M').toUpperCase())
    .pipe(z.enum(['S', 'M', 'L']).catch('M')),
  hidden: bool(false),
  process: text(),
  focus: text(), // which part stays in the cropped banner: top | center | bottom
});

const art = defineCollection({
  loader: glob({ pattern: '*.{yml,yaml}', base: './src/content/art' }),
  schema: z.object({
    bulk: strings(),
    works: z
      .array(work.nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((w): w is z.infer<typeof work> => !!w?.image)),
  }),
});

/* ── Film: one Markdown file per film ─────────────────────────────────────── */
const films = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/films' }),
  schema: z.object({
    published: bool(false),
    order: z.coerce.number().nullish().transform((v) => (Number.isFinite(v) ? (v as number) : 1000)),
    title_en: text(),
    title_ko: text(),
    year: text(),
    format: text(), // feature | short | other
    runtime: text(),
    role_en: text(),
    role_ko: text(),
    logline_en: text(),
    logline_ko: text(),
    still: text(),
    focus: text(),
    trailer: text(),
    full_film: bool(false), // the video is the whole film, not a trailer
    synopsis_en: text(),
    synopsis_ko: text(),
    stills: strings(),
    credits: z
      .array(z.object({ role_en: text(), role_ko: text(), names: strings() }).nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((c): c is NonNullable<typeof c> => !!c && (!!c.role_en || !!c.role_ko || c.names.length > 0))),
    festivals: z
      .array(z.object({ year: text(), text_en: text(), text_ko: text() }).nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((f): f is NonNullable<typeof f> => !!f && (!!f.text_en || !!f.text_ko))),
    links: links(),
  }),
});

/* ── About and Music ─────────────────────────────────────────────────────── */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    // about
    heading: text(),
    statement_en: text(),
    statement_ko: text(),
    bio_en: text(),
    bio_ko: text(),
    portrait: text(),
    portrait_caption_en: text(),
    portrait_caption_ko: text(),
    practices: z
      .array(z.object({ title_en: text(), title_ko: text(), text_en: text(), text_ko: text(), link: text() }).nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((x): x is NonNullable<typeof x> => !!x && !!(x.title_en || x.title_ko))),
    notes: z
      .array(z.object({ label_en: text(), label_ko: text(), text_en: text(), text_ko: text() }).nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((x): x is NonNullable<typeof x> => !!x && !!(x.text_en || x.text_ko))),
    video: text(),
    video_caption_en: text(),
    video_caption_ko: text(),
    address: text(),
    // music
    name: text(),
    intro_en: text(),
    intro_ko: text(),
    links: links(),
  }),
});

/* ── Site settings ───────────────────────────────────────────────────────── */
const hex = (d: string) =>
  z
    .string()
    .nullish()
    .transform((v) => (v && /^#?[0-9a-f]{6}$/i.test(v.trim()) ? '#' + v.trim().replace('#', '').toUpperCase() : d));

const settings = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/content/settings' }),
  schema: z.object({
    site_title: text(),
    wordmark: text(),
    name_en: text(),
    name_ko: text(),
    roles_en: text(),
    roles_ko: text(),
    description_en: text(),
    description_ko: text(),
    email: text(),
    instagram: text(),
    youtube: text(),
    links: links(),
    menu: z
      .object({
        painting_en: text(),
        painting_ko: text(),
        conte_en: text(),
        conte_ko: text(),
        digital_en: text(),
        digital_ko: text(),
        film_en: text(),
        film_ko: text(),
        music_en: text(),
        music_ko: text(),
        about_en: text(),
        about_ko: text(),
      })
      .nullish()
      .transform((v) => v ?? {}),
    pigments: z
      .object({
        ultramarine: hex('#1C2B94'),
        vermilion: hex('#DB3821'),
        viridian: hex('#0A6B5C'),
        ochre: hex('#F2B833'),
      })
      .nullish()
      .transform((v) => v ?? { ultramarine: '#1C2B94', vermilion: '#DB3821', viridian: '#0A6B5C', ochre: '#F2B833' }),
  }),
});

export const collections = { art, films, pages, settings };
