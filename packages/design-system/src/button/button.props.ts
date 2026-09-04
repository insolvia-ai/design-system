// SHARED — no react-native / react-dom / base-ui import. Pure TS + cn().
import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';

export type ButtonIntent = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Three weights of call-to-action, plus the one that destroys something.
 *
 * WHY `danger` IS HERE NOW. It used to be absent, and the reason given was
 * that "the semantic token set has no `danger-text` pair" — true when it was
 * written, and no longer true. `tokens` 0.4.0 measures and ships one:
 *
 *   danger-text on danger    light 6.1:1   dark 6.2:1   ✅ (4.5:1 AA floor)
 *   a hard-coded white       light 6.1:1   dark 2.8:1   ❌ dark
 *
 * The second row is the whole reason this needed a token rather than a colour
 * typed into this file: the dark scheme lifts `danger` to a light red, so a
 * white label fails there and would have looked correct to anyone checking
 * only the light canvas. `danger-text` flips with the scheme, which is what a
 * fill that also flips requires.
 *
 * `IconButton` shipped this fill row first, and its props module argued at
 * length that Button should NOT have it — precisely because a text button
 * carries text and nothing measured said the text was readable. That argument
 * is answered rather than overruled: the measurement now exists. The two
 * controls share one row (`icon-button.props.ts` imports this map), so a text
 * button and an icon button that destroy the same thing read as one control.
 *
 * `active:` repeats the hover colour: the token set derives one hovered danger
 * and no pressed one, and inventing a fourth red here is exactly the
 * hard-coded value the semantic layer exists to prevent.
 */
export const intentStyles: Record<ButtonIntent, string> = {
  primary: 'bg-primary text-primary-text hover:bg-primary-hover active:bg-primary-active',
  secondary: 'bg-surface-alt text-ink hover:bg-line active:bg-line',
  ghost: 'bg-transparent text-ink hover:bg-surface-alt active:bg-line',
  danger: 'bg-danger text-danger-text hover:bg-danger-hover active:bg-danger-hover',
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  // `h-11` (44px), the WCAG 2.5.5 target-size floor the Select trigger and
  // every Wheel row already hold. `sm` stays 32 as a deliberate opt-in to a smaller
  // target, and `lg` was already past it.
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
};

/**
 * The same three sizes, for a button whose label is a SENTENCE.
 *
 * A fixed `h-*` plus `whitespace-nowrap` is right for a word and wrong for a
 * clause. An armed destructive button spells out what it will destroy —
 * "Confirm — delete 54 files" — and on a phone that label ran off the side of
 * the button and gave the whole page a horizontal scrollbar, because a
 * non-wrapping box simply grows.
 *
 * So each row trades the fixed height for the SAME number as a minimum and
 * adds the vertical padding a fixed height was standing in for. A one-line
 * label is therefore laid out exactly as before — the `min-h` is the old `h`
 * — and a two-line one grows down instead of sideways. That is what makes
 * `wrap` safe to reach for without checking whether the label is long enough
 * to need it.
 *
 * Alignment is deliberately NOT changed: `buttonClass` centres its content and
 * a wrapped label stays centred. A caller wanting a ragged-right block adds
 * `text-start`, which is one utility and now merges cleanly.
 */
export const wrapSizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-8 gap-1.5 px-3 py-1.5 text-sm',
  md: 'min-h-11 gap-2 px-4 py-2 text-sm',
  lg: 'min-h-12 gap-2 px-6 py-2.5 text-base',
};

// The `| undefined` on each member is for `exactOptionalPropertyTypes` (on in
// tsconfig.base.json): the web leaf forwards `className` straight from its own
// props, where it is `string | undefined`, and that assignment is an error
// against a bare optional.
export interface ButtonClassOptions {
  intent?: ButtonIntent | undefined;
  size?: ButtonSize | undefined;
  /**
   * Let a sentence-length label wrap onto more than one line, growing the
   * button downwards instead of sideways. See `wrapSizeStyles`.
   */
  wrap?: boolean | undefined;
  className?: string | undefined;
}

/**
 * The button's Tailwind classes, exported so a link can be styled as a button
 * without a polymorphic component: `<Link className={buttonClass({ intent })}>`.
 * Web-only (Tailwind), but the string composition is platform-agnostic, so it
 * lives in the shared props module.
 */
export function buttonClass({
  intent = 'primary',
  size = 'md',
  wrap = false,
  className,
}: ButtonClassOptions = {}) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center rounded-md font-body font-medium no-underline transition-colors',
    // Emitted as a pair with the size row rather than in the base string: a
    // later `whitespace-normal` would merge the earlier `whitespace-nowrap`
    // away, but the fixed `h-*` in `sizeStyles` would survive it and clip the
    // second line. The two have to move together, so they are chosen together.
    wrap ? 'whitespace-normal' : 'whitespace-nowrap',
    focusRing,
    disabledStyles,
    intentStyles[intent],
    wrap ? wrapSizeStyles[size] : sizeStyles[size],
    className,
  );
}
