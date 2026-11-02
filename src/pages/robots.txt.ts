import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const sitemap = new URL(`${base.replace(/\/?$/, '/')}sitemap-index.xml`, site).href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: ${base.replace(/\/?$/, '/')}admin/\n\nSitemap: ${sitemap}\n`, { headers: { 'Content-Type': 'text/plain' } });
};
