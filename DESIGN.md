# Design — round 3

The owner reads as an artist who directs sensory media art. The pigment flow on the home screen is the one bold thing; everything else stays quiet so the paintings carry the colour.

## Rules

- **Home**: the pigment motion only. No artwork on the home screen.
- **Ground**: black `#0C0C0D` (ink `#ECE9E2`, secondary `#ACA79E`) by default; white paper `#F2F0EB` (ink `#1E1D1B`) only with `?bg=white`. Colour lives only in the pigment and in the works.
- **Type**: wordmark in `--f-mark` (Instrument Serif for now, one variable); menu Instrument Sans 500 14px; titles in Instrument Serif with Gowun Batang for Korean; running Korean text in IBM Plex Sans KR.
- **Works**: calm ground behind the art, no moving shader. A banner of the ten latest works, each enlarged to fill one wide frame, one at a time; then a tidy index on one baseline. No cards, borders, shadows or hover zoom (pointing at a work quietens the others). Captions only when there is a title.
- **Film** leads the menu: full-width key art in the cinema ratio, laurels for festival honours, the trailer at the top of each film page.
- **Viewer**: same ground, ink-bleed reveal (~700 ms noise mask; plain fade with reduced motion), only the filled caption fields, never more than 1.5× an image's natural size.
- **Motion**: the gathering-ink motion belongs to the home page only. Inner pages are calm: the wash shape and the page name fade in, sections fade up as they come into view, the art banner slides on slowly, page changes crossfade. Reduced motion turns all of it off.
- **Avoid**: cards with shadows, all-caps eyebrow labels, numbered 01/02 markers, "→" on links, cream + terracotta.
- **Access**: 360 px wide and up with 16 px gutters, visible keyboard focus, alt text from titles ("Untitled, painting" otherwise), reduced motion respected.
