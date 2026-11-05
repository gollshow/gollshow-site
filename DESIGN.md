# Design — round 3

The owner reads as an artist who directs sensory media art. The pigment flow on the home screen is the one bold thing; everything else stays quiet so the paintings carry the colour.

## Rules

- **Home**: the pigment motion only. No artwork on the home screen.
- **Ground**: white paper `#F2F0EB` (ink `#1E1D1B`, secondary `#5A5753`) or black `#0C0C0D` (ink `#ECE9E2`, secondary `#A8A49C`), picked once per browser session. Letters are ink, never pure black on white. Colour lives only in the pigment and in the works.
- **Type**: wordmark in `--f-mark` (Instrument Serif for now, one variable); menu Instrument Sans 500 14px; Korean in IBM Plex Sans KR; titles in Instrument Serif.
- **Works**: calm ground behind the art, no moving shader. A drifting strip of the ten latest works at true proportions, then a tidy index on one baseline. No cards, borders, shadows or hover zoom (pointing at a work quietens the others). Captions only when there is a title.
- **Viewer**: same ground, ink-bleed reveal (~700 ms noise mask; plain fade with reduced motion), only the filled caption fields, never more than 1.5× an image's natural size.
- **Motion**: one ink-wash page transition; the inner-page wash settles and stops; the Latest strip drifts and stops on hover; works and About sections develop in ink as they come into view. Reduced motion turns all of it off.
- **Avoid**: cards with shadows, all-caps eyebrow labels, numbered 01/02 markers, "→" on links, cream + terracotta.
- **Access**: 360 px wide and up with 16 px gutters, visible keyboard focus, alt text from titles ("Untitled, painting" otherwise), reduced motion respected.
