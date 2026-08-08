// SHARED — no react-native / react-dom / base-ui import. Pure data.
export type RibbonTone = 'primary' | 'neutral';
export type RibbonPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * WHY THERE ARE ONLY TWO TONES.
 *
 * A ribbon is a filled block with a label on top, so it needs a
 * background/foreground PAIR that holds up in both schemes. This token set
 * guarantees exactly one: `primary`/`primary-text` (14.4:1 light, 7.5:1 dark,
 * measured off `theme.css`). Filling with `danger` and reusing `primary-text`
 * is 6.1:1 in light but 3.5:1 in dark — a gate failure in one scheme that
 * looks fine in the other, which is the worst way for this to be wrong.
 * `neutral` is `surface-alt`/`ink`, the same safe pair `Badge` uses.
 *
 * See `badge.props.ts` for the same constraint stated at length, and
 * `button.props.ts` for the precedent: no `danger` intent, for this reason.
 */
export const toneStyles: Record<RibbonTone, string> = {
  primary: 'bg-primary text-primary-text',
  neutral: 'bg-surface-alt text-ink',
};

export const positionStyles: Record<RibbonPosition, string> = {
  'top-left': 'left-0 top-0 rounded-br-md rounded-tl-lg',
  'top-right': 'right-0 top-0 rounded-bl-md rounded-tr-lg',
  'bottom-left': 'bottom-0 left-0 rounded-bl-lg rounded-tr-md',
  'bottom-right': 'bottom-0 right-0 rounded-br-lg rounded-tl-md',
};

/** The absolute offsets each corner pins to, for the native leaf. */
export const positionOffsets: Record<
  RibbonPosition,
  { top?: number; bottom?: number; left?: number; right?: number }
> = {
  'top-left': { top: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'bottom-left': { bottom: 0, left: 0 },
  'bottom-right': { bottom: 0, right: 0 },
};
