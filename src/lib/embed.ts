/** Turn a YouTube / Vimeo / Spotify / Adobe page or embed URL into a player URL for a lite embed. */
export type Embed = { src: string; kind: 'youtube' | 'vimeo' | 'spotify' | 'adobe' | 'other'; ratio?: string; height?: number; id?: string };

export function embedFor(url?: string): Embed | undefined {
  if (!url) return;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return;
  }
  const h = u.hostname.replace(/^www\.|^m\./, '');
  if (h === 'youtu.be' || h.endsWith('youtube.com') || h.endsWith('youtube-nocookie.com')) {
    const id = h === 'youtu.be' ? u.pathname.slice(1) : (u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1]);
    if (id) return { src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1&playsinline=1`, kind: 'youtube', ratio: '16 / 9', id };
    return;
  }
  if (h.endsWith('vimeo.com')) {
    const id = u.pathname.match(/(\d{5,})/)?.[1];
    if (id) return { src: `https://player.vimeo.com/video/${id}?dnt=1&autoplay=1`, kind: 'vimeo', ratio: '16 / 9', id };
    return;
  }
  if (h === 'open.spotify.com') {
    const m = u.pathname.match(/\/(artist|album|track|playlist|episode|show)\/([A-Za-z0-9]+)/);
    if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=gollshow`, kind: 'spotify', height: 352, id: m[2] };
    return;
  }
  if (h.endsWith('adobe.io') && u.pathname.includes('/embed')) return { src: url, kind: 'adobe', ratio: '16 / 9' };
}
