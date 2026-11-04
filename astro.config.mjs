import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import { SITE, BASE, CUSTOM_DOMAIN } from './site.config.mjs';

/** Writes dist/CNAME only when a custom domain is switched on (site.config.mjs). */
const cname = () => ({
  name: 'cname',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const file = new URL('CNAME', dir);
      if (CUSTOM_DOMAIN) fs.writeFileSync(file, CUSTOM_DOMAIN + '\n');
      else if (fs.existsSync(file)) fs.rmSync(file);
    },
  },
});

// Old Adobe Portfolio addresses (and the round-2 work pages) keep working.
const old = {
  '/work': '/',
  '/works': '/',
  '/home': '/',
  '/picture': '/painting/',
  '/ttt': '/painting/',
  '/contepastel': '/conte-pastel/',
  '/music-1': '/music/',
  '/test': '/about/',
  '/yyy': '/painting/',
  '/uuu': '/painting/',
  '/willow-and-water-lily': '/painting/',
  '/works/gogo': '/painting/',
  '/works/pear-blossom': '/painting/',
  '/works/willow-and-water-lily': '/painting/',
};

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  scopedStyleStrategy: 'class',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  redirects: Object.fromEntries(Object.entries(old).map(([from, to]) => [from, BASE.replace(/\/$/, '') + to])),
  image: {
    responsiveStyles: false,
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/admin\//.test(page) && !Object.keys(old).some((o) => page.replace(/\/$/, '').endsWith(o)),
    }),
    cname(),
  ],
  cacheDir: './.cache/astro',
  devToolbar: { enabled: false },
});
