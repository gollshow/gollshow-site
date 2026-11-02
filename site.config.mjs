/**
 * ── Domain switch ────────────────────────────────────────────────────────────
 * The site is served at https://gollshow.github.io/gollshow-site/ until the
 * domain moves. To serve it at https://gollshow.com instead, change ONE line:
 *
 *     export const CUSTOM_DOMAIN = 'gollshow.com';
 *
 * The build then uses https://gollshow.com as the site URL, drops the
 * /gollshow-site base path, and writes the CNAME file GitHub Pages needs.
 * (Do the DNS steps in README.md first.)
 */
export const CUSTOM_DOMAIN = '';

export const GITHUB_OWNER = 'gollshow';
export const GITHUB_REPO = 'gollshow-site';

export const SITE = CUSTOM_DOMAIN ? `https://${CUSTOM_DOMAIN}` : `https://${GITHUB_OWNER}.github.io`;
export const BASE = CUSTOM_DOMAIN ? '/' : `/${GITHUB_REPO}/`;
