// SHARED — imports `react` and `../lib/controllable` only. No react-dom, no
// react-native. This is Rating's entire behaviour model: the selected value,
// the click/press "same star clears" rule, the keyboard grammar, and the
// roving-tabindex arithmetic. Both leaves consume it verbatim; what differs
// is the DOM/keyboard wiring (web-only, see rating.web.tsx) and the star
// glyph's rendering source (SVG path here shared as data; a Text glyph on
// native, which has no SVG without a dependency — see rating.native.tsx).
//
// INTEGER VALUES ONLY — no half-star precision, and this is a boundary this
// module does not cross. Half-precision needs pointer-position maths (which
// third of a 20px box did the pointer land in) to decide the value, and that
// maths has no keyboard equivalent (an arrow key does not have a fractional
// position) and no honest touch equivalent either (a fingertip is wider than
// a half-star's hit region). A control whose only precise input method is a
// mouse is not this package's idea of an accessible rating; the surface a
// half star would buy is not worth losing the other two input methods.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export type RatingSize = 'sm' | 'md' | 'lg';

/** Star box, in px — matches the web leaf's `size-*` Tailwind utilities. */
export const sizeBoxPx: Record<RatingSize, number> = { sm: 20, md: 28, lg: 36 };

/**
 * Numeric Tailwind `size-*` utilities (1 unit = 4px), NOT the t-shirt
 * `size-sm`/`size-lg` family this repo's ESLint config rejects — those
 * resolve against the spacing scale (`size-lg` is 16px) and cannot express
 * 20/28/36 at all. `size-5`/`size-7`/`size-9` are the same 20/28/36px as
 * `sizeBoxPx`, spelled the way Tailwind's own numeric scale spells them.
 */
export const sizeStyles: Record<RatingSize, string> = {
  sm: 'size-5',
  md: 'size-7',
  lg: 'size-9',
};

/**
 * A five-point star, self-computed on a unit circle (outer radius 10, inner
 * radius 3.82 — the ratio that produces a regular pentagram) centred in a
 * 24×24 viewBox. Not traced from any icon set: this package draws its own
 * geometry so nothing here carries another product's silhouette, the same
 * reason the look brief rules out Material's yellow rather than just its
 * fill color.
 */
export const STAR_PATH =
  'M12 2L14.25 8.91L21.51 8.91L15.63 13.18L17.88 20.09L12 15.82L6.12 20.09L8.37 13.18L2.49 8.91L9.75 8.91Z';

/** `"1 star"`, `"2 stars"`, … — the default per-item accessible name. */
export function defaultFormatItemLabel(n: number): string {
  return n === 1 ? '1 star' : `${n} stars`;
}

/** `"3 of 5 stars"` — the single accessible name a `readOnly` Rating carries
 * as one `role="img"`/`accessibilityRole="image"` element, not per star. */
export function formatValueLabel(value: number | null, max: number): string {
  return `${value ?? 0} of ${max} stars`;
}

export interface RatingOwnProps {
  /** Controlled value, `1..max` or `null` for "not rated". Pair with `onValueChange`. */
  value?: number | null | undefined;
  /** Uncontrolled starting value. Defaults to `null` (not rated). */
  defaultValue?: number | null | undefined;
  /** Fires with the value the control *wants*, in both modes. */
  onValueChange?: ((next: number | null) => void) | undefined;
  /** Star count. Defaults to 5. */
  max?: number | undefined;
  size?: RatingSize | undefined;
  /** Display only: renders the value, no radios, no hover, no press. Still
   * announced — see `formatValueLabel`. */
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  /** The group's accessible name. Defaults to `'Rating'`. */
  label?: string | undefined;
  /** Per-star accessible name, e.g. `formatItemLabel(3)`. Defaults to
   * `defaultFormatItemLabel` (`"1 star"`, `"2 stars"`, …). */
  formatItemLabel?: ((n: number) => string) | undefined;
}

export interface RatingState {
  value: number | null;
  setValue: (next: number | null) => void;
}

/** The value state machine — pure React, identical on both platforms. */
export function useRatingState(
  value: number | null | undefined,
  defaultValue: number | null | undefined,
  onValueChange: ((next: number | null) => void) | undefined,
): RatingState {
  const [current, setCurrent] = useControllableState<number | null>(
    value,
    defaultValue ?? null,
    onValueChange,
  );
  return React.useMemo(() => ({ value: current, setValue: setCurrent }), [current, setCurrent]);
}

/**
 * What pressing/clicking star `n` does to the current value: sets it, unless
 * `n` is already the value, in which case it clears — the MUI-reference
 * behaviour the component brief calls "clearable".
 *
 * UNCONDITIONAL, with no `clearable` prop gating it. A control that lets a
 * user SET a value has to let them UNSET it without reaching for a different
 * input method (there is no keyboard-free way to "type null"), so gating the
 * one gesture that clears behind a flag would strand a mouse-and-touch-only
 * user on whatever they clicked first. The rejected alternative — a
 * `clearable` boolean, default `true` — added a prop whose only honest
 * default already IS this function's behaviour.
 */
export function nextValueOnPress(current: number | null, n: number): number | null {
  return current === n ? null : n;
}

/**
 * WAI-ARIA roving-tabindex rule for the radio group: the star matching the
 * current value is tabbable; when nothing is rated, the first star is —
 * same rule and same reason as `radioItemTabIndex` in radio-group.props.ts.
 */
export function ratingItemTabIndex(itemIndex: number, value: number | null): 0 | -1 {
  if (value === null) return itemIndex === 1 ? 0 : -1;
  return itemIndex === value ? 0 : -1;
}

/**
 * What a keypress means, pure — mirrors `selectKeyIntent`'s reasoning
 * (select.props.ts): one testable table instead of a switch statement buried
 * in the web leaf's `onKeyDown`. Web-only; the native leaf has no keyboard
 * concept of its own, same split `radio-group.props.ts` documents for its
 * roving tabIndex.
 *
 * DELIBERATELY DOES NOT WRAP past 1 or `max` — same APG-pattern reasoning
 * `stepEnabled` in select.props.ts gives: holding an arrow key settles on an
 * end rather than cycling past it. Home/End jump there directly.
 * Backspace/Delete clears unconditionally, matching `nextValueOnPress`.
 */
export type RatingKeyIntent = { kind: 'none' } | { kind: 'set'; value: number } | { kind: 'clear' };

export function ratingKeyIntent(key: string, current: number | null, max: number): RatingKeyIntent {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp': {
      if (current === null) return { kind: 'set', value: 1 };
      if (current >= max) return { kind: 'none' };
      return { kind: 'set', value: current + 1 };
    }
    case 'ArrowLeft':
    case 'ArrowDown': {
      if (current === null) return { kind: 'set', value: 1 };
      if (current <= 1) return { kind: 'none' };
      return { kind: 'set', value: current - 1 };
    }
    case 'Home':
      return { kind: 'set', value: 1 };
    case 'End':
      return { kind: 'set', value: max };
    case 'Backspace':
    case 'Delete':
      return current === null ? { kind: 'none' } : { kind: 'clear' };
    default:
      return { kind: 'none' };
  }
}
