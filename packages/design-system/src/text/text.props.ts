// SHARED — no react-native / react-dom / base-ui import. Pure data: the
// variant, tone and weight maps both leaves key off. Per the litmus test in
// the package CLAUDE.md, typography carries no events, no state and no a11y
// wiring beyond the heading role each leaf applies in its own dialect, so the
// maps collapse into one file rather than forking into two copies that could
// disagree about what `title` means.
export type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'caption';
export type TextTone = 'ink' | 'muted' | 'primary';
export type TextWeight = 'regular' | 'medium' | 'semibold';
export type TextFamily = 'body' | 'heading' | 'mono';

/**
 * The five sizes this package actually renders, named for their job rather
 * than their size — `display` is a page's opening statement, `caption` is
 * metadata under something else. A consumer wanting a sixth reaches for
 * `className` (web) or `style` (native) instead of a new variant, because a
 * variant costs a matching block in the native leaf forever.
 */
export const variantStyles: Record<TextVariant, string> = {
  display: 'text-3xl',
  heading: 'text-2xl',
  title: 'text-lg',
  body: 'text-sm',
  caption: 'text-xs',
};

/**
 * The family each variant implies, and the family a caller can override it
 * with.
 *
 * WHY THE FAMILY LEFT `variantStyles`. It used to be baked in there
 * (`display: 'font-heading text-3xl'`), which made the variant's family
 * unoverridable in the only way that would have worked: appending
 * `font-mono` after `font-heading` leaves BOTH classes in the string —
 * `tailwind-merge` does not treat this package's family utilities as one
 * conflict group — and which one wins is then decided by stylesheet order,
 * not by the caller. So the family is resolved BEFORE the class list is
 * built, exactly as `weight` already was: `variantWeight` + `weightStyles` is
 * the pattern this mirrors, and `variantStyles` is now the size step alone.
 * Rendered output for every existing caller is unchanged.
 *
 * WHY `mono` DOES NOT BRING `tabular-nums`. The obvious convenience — a mono
 * family that also lines up its digits — would be a no-op dressed as a
 * feature: a monospaced family advances EVERY glyph by the same width,
 * digits included, and `--font-mono` resolves to a stack that ends in the
 * `monospace` generic, so there is no arm of it where the digits are
 * proportional. Bundling it would teach callers that `family="mono"` does two
 * things when it does one, and would hide the case that actually needs it —
 * tabular figures on a PROPORTIONAL family, a price column set in `body` —
 * which `family="mono"` cannot deliver anyway because it changes the face.
 * That caller reaches for `className="tabular-nums"` (web) or
 * `style={{ fontVariant: ['tabular-nums'] }}` (native), one utility, at the
 * one site that wants it.
 */
export const variantFamily: Record<TextVariant, TextFamily> = {
  display: 'heading',
  heading: 'heading',
  title: 'heading',
  body: 'body',
  caption: 'body',
};

/**
 * Web utilities per family. The native leaf cannot use these — React Native
 * resolves ONE registered family name rather than a CSS stack — so it maps the
 * same three names onto `src/lib/native-typography.native.ts` instead. That
 * split is the whole reason this map holds names and not stacks.
 */
export const familyStyles: Record<TextFamily, string> = {
  body: 'font-body',
  heading: 'font-heading',
  mono: 'font-mono',
};

/**
 * WHY THERE ARE THREE TONES AND NOT SIX.
 *
 * The obvious set — add `danger`, `success`, `warning` — does not survive
 * contrast in both schemes. Measured against `theme.css`'s own values, on the
 * app background (`bg`) at 14px:
 *
 *   ink      light 16.7:1   dark 16.5:1   ✅
 *   muted    light  5.6:1   dark 11.2:1   ✅
 *   primary  light 13.8:1   dark  7.8:1   ✅
 *   danger   light  5.8:1   dark  6.2:1   ✅ since tokens 0.3.0
 *   success  light  4.7:1   dark  6.4:1   ✅ since tokens 0.3.0
 *   warning  light  3.1:1   dark  7.8:1   ❌ light
 *
 * A `warning` tone is unreadable in light, and `Text` is the one component with
 * no box of its own to sit the colour against — so there is no arrangement that
 * rescues it. Offering a tone that fails in one scheme is worse than not
 * offering it: it fails on exactly the half of users the author was not looking
 * at.
 *
 * `warning` at 3.06:1 is not a guess. It is what the a11y gate returned the
 * first time this component shipped six tones, which is the only reason the
 * measurements above exist.
 *
 * THE DANGER AND SUCCESS ROWS USED TO READ 2.9:1 AND 3.5:1 IN DARK, and both
 * were real failures rather than reasons — the dark scheme aliased the same
 * mid-lightness hue the light scheme uses, which no dark canvas can carry.
 * tokens 0.3.0 gave each a lifted dark value, so the constraint that kept them
 * out of this set is gone. They are NOT added here: a new tone is an API
 * change, and this file's job is to stop recording a limit that no longer
 * exists. Adding them is a deliberate, separate decision — and `warning` still
 * cannot come with them, so the set would be five, not six.
 *
 * `button.props.ts` records the same token gap as its reason for having no
 * `danger` intent, and `badge.props.ts` for carrying intent as a dot; both
 * predate the token fix and neither has been re-argued. A semantic colour is
 * always safe as a FILL behind `primary-text`, or as a border — neither has a
 * text-contrast requirement to meet.
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
