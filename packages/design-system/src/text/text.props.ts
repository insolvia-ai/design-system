// SHARED — no react-native / react-dom / base-ui import. Pure data: the
// variant, tone and weight maps both leaves key off. Per the litmus test in
// the package CLAUDE.md, typography carries no events, no state and no a11y
// wiring beyond the heading role each leaf applies in its own dialect, so the
// maps collapse into one file rather than forking into two copies that could
// disagree about what `title` means.
export type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'caption';
export type TextTone = 'ink' | 'muted' | 'primary';
export type TextWeight = 'regular' | 'medium' | 'semibold';

/**
 * The five sizes this package actually renders, named for their job rather
 * than their size — `display` is a page's opening statement, `caption` is
 * metadata under something else. A consumer wanting a sixth reaches for
 * `className` (web) or `style` (native) instead of a new variant, because a
 * variant costs a matching block in the native leaf forever.
 */
export const variantStyles: Record<TextVariant, string> = {
  display: 'font-heading text-3xl',
  heading: 'font-heading text-2xl',
  title: 'font-heading text-lg',
  body: 'font-body text-sm',
  caption: 'font-body text-xs',
};

/**
 * WHY THERE ARE THREE TONES AND NOT SIX.
 *
 * The obvious set — add `danger`, `success`, `warning` — does not survive
 * contrast in both schemes. Measured against `theme.css`'s own values, on the
 * app background (`bg`) at 14px:
 *
 *   ink      light 15.9:1   dark 14.7:1   ✅
 *   muted    light  5.6:1   dark 11.2:1   ✅
 *   primary  light 13.7:1   dark  7.9:1   ✅
 *   danger   light  5.8:1   dark  2.9:1   ❌ dark
 *   success  light  4.8:1   dark  3.5:1   ❌ dark
 *   warning  light  3.1:1   dark  7.9:1   ❌ light
 *
 * A `warning` tone is unreadable in light and a `danger` tone in dark, and
 * `Text` is the one component with no box of its own to sit the colour
 * against — so there is no arrangement that rescues them. Offering a tone that
 * fails in one scheme is worse than not offering it: it fails on exactly the
 * half of users the author was not looking at.
 *
 * `warning` at 3.06:1 is not a guess. It is what the a11y gate returned the
 * first time this component shipped six tones, which is the only reason the
 * measurements above exist.
 *
 * This is the same token gap `button.props.ts` records as its reason for
 * having no `danger` intent, and `badge.props.ts` for carrying intent as a dot.
 * A semantic colour is safe as a FILL behind `primary-text`, or as a border —
 * neither has a text-contrast requirement to meet. It is not safe as ink.
 */
export const toneStyles: Record<TextTone, string> = {
  ink: 'text-ink',
  muted: 'text-muted',
  primary: 'text-primary',
};

export const weightStyles: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
};

/** The default weight per variant — headings carry their own weight. */
export const variantWeight: Record<TextVariant, TextWeight> = {
  display: 'semibold',
  heading: 'semibold',
  title: 'semibold',
  body: 'regular',
  caption: 'regular',
};

/**
 * Which variants are headings.
 *
 * Both leaves need the answer and neither can borrow the other's: the web leaf
 * turns it into an `<h1>`/`<h2>`/`<h3>` element, the native leaf into
 * `accessibilityRole="header"`. Keeping the PREDICATE shared is what stops the
 * two from disagreeing about which sizes are structural — the same divergence
 * class the Card story documents for `Card.Title`.
 */
export function isHeadingVariant(variant: TextVariant): boolean {
  return variant === 'display' || variant === 'heading' || variant === 'title';
}
