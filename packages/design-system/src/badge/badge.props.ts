// SHARED — no react-native / react-dom / base-ui import. Pure data.
export type BadgeIntent = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md';

/**
 * WHY A BADGE IS NEUTRAL CHROME WITH AN INTENT DOT, and not a coloured pill.
 *
 * The obvious design — fill the pill with the intent colour, or tint the
 * background and colour the label — cannot be made accessible from this token
 * set in BOTH schemes. Measured against `theme.css`'s own values:
 * `warning` on `card` is 3.2:1 in light, and `success` on `card` is 3.5:1 in
 * dark; a solid fill fares no better, because the only foreground/background
 * pair the tokens guarantee across schemes is `primary`/`primary-text` — there
 * is no `success-text` or `warning-text`. That is the same gap `button.props`
 * records as the reason there is no `danger` Button intent.
 *
 * So the label stays `ink` on `surface-alt`, which is legible in both schemes
 * at every size, and the intent shows as a small dot beside it. The dot is
 * decorative (`aria-hidden` on web, `accessible={false}` on native): colour is
 * never the only carrier of the meaning, because the badge's own text says
 * what it is.
 */
export const dotSizePx: Record<BadgeSize, number> = { sm: 6, md: 8 };

export const sizeStyles: Record<BadgeSize, string> = {
  sm: 'h-5 gap-1 px-2 text-xs',
  md: 'h-6 gap-1.5 px-2.5 text-xs',
};

/** The dot's fill per intent. `neutral` renders no dot at all. */
export const dotStyles: Record<Exclude<BadgeIntent, 'neutral'>, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function hasDot(intent: BadgeIntent): intent is Exclude<BadgeIntent, 'neutral'> {
  return intent !== 'neutral';
}
