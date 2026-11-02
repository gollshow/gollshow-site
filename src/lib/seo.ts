import type { Work } from './works';
import { CATEGORY } from './i18n';

type S = { name?: string; name_en?: string; roles_en?: string; email?: string; instagram?: string; links?: { url?: string }[]; site_title?: string };

export function personLd(s: S, site?: URL) {
  const url = new URL(import.meta.env.BASE_URL, site).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': url + '#goll',
    name: 'goll',
    alternateName: [s.name_en, s.name].filter(Boolean),
    url,
    jobTitle: s.roles_en?.split(/\s*[·,]\s*/).filter(Boolean),
    email: s.email ? `mailto:${s.email}` : undefined,
    sameAs: [s.instagram, ...(s.links ?? []).map((l) => l.url)].filter(Boolean),
  };
}

export function workLd(w: Work, site: URL | undefined, image?: string) {
  const base = new URL(import.meta.env.BASE_URL, site).href;
  const cat = w.data.category;
  const type = cat === 'music' ? 'MusicComposition' : cat === 'film' ? 'Movie' : 'VisualArtwork';
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    name: w.data.title,
    alternateName: w.data.title_en,
    url: new URL(w.href.replace(/^\//, ''), base).href,
    image,
    dateCreated: w.data.year,
    description: w.data.description_en ?? w.data.description,
    inLanguage: 'ko',
    genre: CATEGORY[cat]?.en,
  };
  const creator = { '@type': 'Person', '@id': base + '#goll', name: 'goll' };
  if (type === 'VisualArtwork') Object.assign(ld, { creator, artMedium: w.data.medium_en ?? w.data.medium, artform: CATEGORY[cat]?.en, size: w.data.size });
  else if (type === 'MusicComposition') Object.assign(ld, { composer: creator });
  else Object.assign(ld, { director: creator });
  return ld;
}
