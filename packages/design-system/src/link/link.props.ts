// SHARED — no react-native / react-dom / base-ui import. Pure data: two
// independent axes (colour, underline visibility) with no state or a11y
// wiring of their own, so both stay here rather than forking into a pair.
//
// THIS PACKAGE KNOWS NOTHING ABOUT ROUTERS. `Link` is `href` plus an anchor on
// web (`Linking.openURL` on native) — nothing here decorates browser history,
// intercepts a click for client-side navigation, or has an opinion about what
// a "route" is. A consumer wanting client-side routing wraps this component
// with their own router's Link (Next's `<Link>`, React Router's `<Link>`),
// which is exactly why the web leaf never calls `preventDefault` on its own
// `onClick` — a wrapper that needs to intercept the click still can.

/** Colour with no semantics — this is `tone`, not `intent`: a link is never
 * "successful" or "dangerous", it just needs to read at a different weight
 * against the prose around it. */
export type LinkTone = 'primary' | 'ink' | 'muted';

/** Whether the underline shows always, only on hover, or never. */
export type LinkUnderline = 'always' | 'hover' | 'none';

/**
 * WHY `ink` AND `muted` MOVE THE UNDERLINE ON HOVER INSTEAD OF THE COLOUR.
 *
 * `primary` has a dedicated hover step of its own — `--color-primary-hover`,
 * the same token Button's `primary` intent and Toggle's pressed state already
 * read — so it gets a real colour change. `ink` and `muted` have no such
 * token: tokens.json ships one hover step per role that needs one, not one per
 * role that exists, and inventing `ink-hover`/`muted-hover` for two link
 * tones is the same trap `button.props.ts` already turned down for a
 * `danger` TEXT colour outside the pairs it measures. Nudging
 * `underline-offset` on hover instead is a real, visible "you're over it"
 * that stays inside the palette this package is allowed to draw from.
 */
export const toneStyles: Record<LinkTone, string> = {
  primary: 'text-primary hover:text-primary-hover',
  ink: 'text-ink hover:underline-offset-4',
  muted: 'text-muted hover:underline-offset-4',
};

export const underlineStyles: Record<LinkUnderline, string> = {
  always: 'underline underline-offset-2',
  hover: 'no-underline hover:underline underline-offset-2',
  none: 'no-underline',
};

/**
 * The decorative glyph marking an external link on web. `aria-hidden` in the
 * leaf — it carries no meaning a screen reader should stop on, because
 * `EXTERNAL_HINT_TEXT` says the same thing in words.
 */
export const EXTERNAL_GLYPH = '↗';

/**
 * The screen-reader-only text appended after an external link's visible
 * content. Not sourced from a shared visually-hidden component — this
 * package does not have one yet — so the web leaf writes its own `sr-only`
 * span until it does; this string is exported so a caller asserting on the
 * a11y note in a test does not have to duplicate the copy.
 */
export const EXTERNAL_HINT_TEXT = '(opens in a new tab)';
