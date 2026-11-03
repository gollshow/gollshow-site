/** Turn a YouTube / Vimeo / SoundCloud page URL into an embeddable player URL. */
export function embedFor(url?: string): { src: string; kind: 'youtube' | 'vimeo' | 'soundcloud'; ratio: string } | undefined {
  if (!url) return;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return;
  }
  const h = u.hostname.replace(/^www\.|^m\./, '');
  if (h === 'youtu.be' || h.endsWith('youtube.com') || h.endsWith('youtube-nocookie.com')) {
    const id = h === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1];
    if (id) return { src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`, kind: 'youtube', ratio: '16/9' };
  }
  if (h.endsWith('vimeo.com')) {
    const id = u.pathname.match(/(\d{5,})/)?.[1];
    if (id) return { src: `https://player.vimeo.com/video/${id}?dnt=1&autoplay=1`, kind: 'vimeo', ratio: '16/9' };
  }
  if (h.endsWith('soundcloud.com')) {
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%231a1a18&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
    return { src, kind: 'soundcloud', ratio: u.pathname.split('/').filter(Boolean).length > 2 || u.pathname.includes('/sets/') ? '16/5' : '16/5' };
  }
}

/** A `video` field → an iframe src: YouTube / Vimeo page links become players; embed URLs (Adobe…) are used as given. */
export function videoSrc(url?: string) {
  if (!url) return;
  const e = embedFor(url);
  if (e && e.kind !== 'soundcloud') return e.src.replace(/[?&]autoplay=1/, (m) => (m.startsWith('?') ? '?' : '')).replace('?&', '?');
  return url;
}
