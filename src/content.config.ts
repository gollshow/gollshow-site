import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Text fields written by the CMS may be missing, null or "" – normalise to string|undefined. */
const text = () =>
  z
    .union([z.string(), z.number()])
    .nullish()
    .transform((v) => (v === null || v === undefined || String(v).trim() === '' ? undefined : String(v).trim()));

const bool = (d = false) => z.boolean().nullish().transform((v) => v ?? d);

export const CATEGORIES = ['painting', 'conte-pastel', 'digital', 'music', 'film', 'etc'] as const;

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.coerce.string(),
    title_en: text(),
    year: text(),
    category: z.enum(CATEGORIES).catch('etc'),
    medium: text(),
    medium_en: text(),
    size: text(),
    images: z
      .array(
        z.union([
          z.string(),
          z.object({ image: text(), caption: text(), caption_en: text() }),
        ]),
      )
      .nullish()
      .transform((list) =>
        (list ?? [])
          .map((i) => (typeof i === 'string' ? { image: i, caption: undefined, caption_en: undefined } : i))
          .filter((i): i is { image: string; caption?: string; caption_en?: string } => !!i.image),
      ),
    cover: text(),
    description: text(),
    description_en: text(),
    audio: text(),
    link: text(),
    featured: bool(false),
    order: z.coerce.number().nullish().transform((v) => (Number.isFinite(v) ? (v as number) : 1000)),
    draft: bool(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: text(),
    title_en: text(),
    bio: text(),
    bio_en: text(),
    portrait: text(),
    cv: z
      .array(z.object({ year: text(), text: text(), text_en: text() }))
      .nullish()
      .transform((v) => v ?? []),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml,json}', base: './src/content/settings' }),
  schema: z.object({
    site_title: text(),
    name: text(),
    name_en: text(),
    roles: text(),
    roles_en: text(),
    hero_text: text(),
    hero_image: text(),
    intro: text(),
    intro_en: text(),
    description: text(),
    description_en: text(),
    email: text(),
    instagram: text(),
    links: z
      .array(z.object({ label: text(), url: text() }))
      .nullish()
      .transform((v) => (v ?? []).filter((l) => l.url)),
  }),
});

export const collections = { works, pages, settings };
