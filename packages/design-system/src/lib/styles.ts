// Shared web style fragments for the UI primitives. Plain Tailwind class
// strings — platform-agnostic text, no react-dom/react-native import — so they
// can live beside the props modules. The native leaves ignore them and style
// off @insolvia-ai/tokens instead.

export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export const disabledStyles =
  'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * A 44×44 hit area on TOUCH, without moving the box anyone can see.
 *
 * WCAG 2.5.5 asks for 44×44. A `size="sm"` icon control is 32, which this
 * package calls a deliberate opt-in to a smaller VISUAL target for dense
 * chrome — a row's `⋯`, a tile's corner — and that reasoning holds for a
 * mouse, which can aim at 32px, and fails for a finger, which is wider than
 * the box it is aiming at.
 *
 * So the target grows and the drawing does not. A centred `::after` is what
 * separates the two: `min-height`/`min-width` would have been the shorter
 * spelling and the wrong one — it grows the BORDER BOX, so a `danger` icon
 * button would paint a 44px red square where a 32px one was designed. The
 * pseudo-element has no paint at all; it only catches the press.
 *
 * `pointer: coarse` rather than a viewport width, because the condition is the
 * input device and not the screen size — a touchscreen laptop needs this and a
 * narrow desktop window does not. A consumer had been adding a class of its own
 * to every icon button by hand, with a lint rule to keep it there; a hit area
 * is not something a call site should have to remember.
 *
 * The overlay is bigger than the button, so two adjacent `sm` controls with a
 * small gap have overlapping targets and the later one in DOM order wins the
 * overlap. That is inherent to expanding a target past its box, and is still
 * strictly better than a 32px target a finger misses.
 */
export const coarseTouchTarget =
  'relative pointer-coarse:after:absolute pointer-coarse:after:left-1/2 pointer-coarse:after:top-1/2 ' +
  'pointer-coarse:after:size-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 ' +
  "pointer-coarse:after:content-['']";
