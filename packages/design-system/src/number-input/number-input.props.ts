// SHARED — `react` and `../lib/controllable` only. No react-dom, no
// react-native.
//
// A numeric field is Input's `type="number"` plus two things a bare text box
// cannot express: a value that IS a number rather than a string a caller has
// to parse, and steppers that move it by a known amount. Everything that
// renders — an `<input>` with two `<button>`s against a `TextInput` with two
// `Pressable`s — stays in the leaves; what composes across both is the parse,
// the clamp, the step arithmetic and the draft-vs-committed state machine
// below.
//
// WHY THE VALUE IS `number | null`, NOT A STRING. `Input` (and its
// `type="number"`) hands back whatever the box contains, string always,
// `''` for empty — pushing "is this a number, and which one" onto every
// caller. A numeric field's whole reason to exist is to answer that once.
// `null` is the empty state; there is no second "is this set" flag to keep in
// sync with it, the way `DateInput` needs `DateStatus` for a string value that
// cannot itself say "nothing yet" vs "not typed enough yet".
//
// WHY THERE IS NO `formatOptions`. A masked, `Intl`-formatted numeric field —
// thousands separators, a currency symbol, a locale decimal comma — is a
// different component with a different contract: its stored value is still a
// plain number, but its DISPLAY needs a locale the caller owns, not one this
// package can guess from a token. Bolting `Intl.NumberFormat` options onto this
// component would mean formatting the draft while someone is mid-keystroke,
// which is exactly the class of bug `DateInput`'s mask exists to avoid for
// dates. So: this field holds the raw number, a consumer formats it for
// display wherever it is shown read-only, and typing here stays plain digits.
//
// WHY `parseNumber` ACCEPTS `.` AND NOT `,`. Some locales write the decimal
// point as a comma, but this component has no locale to consult — see above —
// so it picks the one separator JavaScript's own `Number()` already agrees on
// rather than guessing between "1,234" (a thousand) and "1,5" (one and a
// half) with no way to tell them apart.
//
// WHY CLAMPING HAPPENS ON BLUR, NOT PER KEYSTROKE. A field with `min={10}`
// clamping on every change would turn "1" (on the way to typing "15") into
// "10" the instant the first digit lands, and the second digit would then be
// typed into an already-wrong box. So the box keeps a free STRING draft while
// focused — good enough to hold `"1"`, `"1."` or `"-"`, none of which parse to
// a usable number yet — and only `commit()` (blur, Enter, or a stepper press)
// turns it into a clamped number and reprints the box to match. That is also
// why `onValueChange` fires on commit only: a caller watching `value` would
// otherwise see it thrash through every clamp of an in-progress digit.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

/** Which way a stepper (or an arrow key, or an accessibility action) moves. */
export type NumberInputStepDirection = 'increment' | 'decrement';

export const DEFAULT_STEP = 1;
export const DEFAULT_INCREMENT_LABEL = 'Increase';
export const DEFAULT_DECREMENT_LABEL = 'Decrease';

/**
 * A typed draft to a number, or `null` for "not a usable number yet".
 *
 * Deliberately narrow: digits, at most one `.`, an optional leading `-`. No
 * thousands separators (a display concern this component does not have — see
 * the header), no exponent notation (`1e5`) — a spinbutton is for entering a
 * plain quantity, not scientific notation, and admitting `e` would make `e`
 * itself a typeable, silently-swallowed character in a field with no way to
 * show it was rejected.
 *
 * A bare sign or a bare `.` (`"-"`, `"."`, `"-."`) parses to `null` rather
 * than `0` — nothing has been typed yet, and treating it as zero would commit
 * a value nobody asked for the moment focus left mid-keystroke.
 */
const NUMBER_TEXT = /^-?\d*\.?\d*$/;

export function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '' || !NUMBER_TEXT.test(trimmed) || !/\d/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** The text a committed value prints as. The inverse of {@link parseNumber}. */
function formatValue(n: number | null): string {
  return n === null ? '' : String(n);
}

/**
 * Trim binary-float noise without pinning a scale — `0.1 + 0.2` lands on
 * `0.3`. Same rule and same reason as `slider.props.ts`'s `tidy`.
 */
function tidy(n: number): number {
  return Number(n.toPrecision(12));
}

/** `n` folded into `[min, max]`. Either bound left `undefined` does not clamp. */
export function clamp(n: number, min?: number | undefined, max?: number | undefined): number {
  let result = n;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

/**
 * The value one step in `direction` from `current`, clamped into range.
 *
 * `current === null` steps from `min ?? 0` — the same "empty starts at the
 * floor" rule a slider's `defaultValue` uses, rather than from `0 ± step`,
 * which would let a single press on a `min={10}` field land below its own
 * floor.
 */
export function stepValue(
  current: number | null,
  direction: NumberInputStepDirection,
  step: number,
  min?: number | undefined,
  max?: number | undefined,
): number {
  if (current === null) return clamp(min ?? 0, min, max);
  const sign = direction === 'increment' ? 1 : -1;
  return clamp(tidy(current + sign * step), min, max);
}

export interface NumberInputOwnProps {
  // `| undefined` on every optional is required, not noise:
  // `exactOptionalPropertyTypes` is on, and without it a leaf cannot spread a
  // possibly-undefined prop through. Same note as input.props.ts.
  /** Controlled value. Pair with `onValueChange`. `null` is empty. */
  value?: number | null | undefined;
  /** Uncontrolled starting value. Defaults to `null` (empty). */
  defaultValue?: number | null | undefined;
  /**
   * Fires with the COMMITTED value — on blur, Enter, or a stepper press —
   * never per keystroke. See the header note on why clamping (and therefore
   * reporting) waits for commit.
   */
  onValueChange?: ((next: number | null) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** Granularity for the steppers and the arrow keys. Defaults to 1. */
  step?: number | undefined;
  disabled?: boolean | undefined;
  /** Visible and selectable, but not editable — steppers are disabled too. */
  readOnly?: boolean | undefined;
  /**
   * Marks the control invalid on its own — independent of the `invalid` a
   * surrounding `Field.Root` may set. Either one is enough.
   */
  invalid?: boolean | undefined;
  /** Submitted name. Falls back to the surrounding Field's `name`. */
  name?: string | undefined;
  placeholder?: string | undefined;
  /** Accessible name for the increment button. Defaults to `'Increase'`. */
  incrementLabel?: string | undefined;
  /** Accessible name for the decrement button. Defaults to `'Decrease'`. */
  decrementLabel?: string | undefined;
}

export interface NumberInputState {
  /** What the box shows — a free-form string while focused. */
  text: string;
  /** Update the draft as it is typed. Does not clamp or report. */
  setText: (next: string) => void;
  /** The last committed value. `null` is empty. */
  value: number | null;
  /** Call on focus: the draft stops tracking an externally-changing `value`. */
  focus: () => void;
  /** Parse the draft, clamp it, commit, and reprint. Call on blur and Enter. */
  commit: () => void;
  /**
   * Step from the committed value and commit immediately — a stepper press or
   * an accessibility action. `multiplier` is Shift+Arrow's ×10, on the web
   * leaf only.
   */
  stepBy: (direction: NumberInputStepDirection, multiplier?: number) => void;
  /** Jump straight to a value (Home/End) and commit immediately. */
  setValue: (next: number) => void;
}

export interface NumberInputStateOptions {
  value?: number | null | undefined;
  defaultValue?: number | null | undefined;
  onValueChange?: ((next: number | null) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step: number;
}

/**
 * The draft/committed state machine both leaves render from.
 *
 * TWO PIECES OF STATE, not one. `committed` (via `useControllableState`) is
 * the value a caller's `value`/`onValueChange` sees. `text` is what the box
 * shows, and only tracks `committed` while NOT mid-edit — `editing` (a ref:
 * flipping it must not itself re-render) marks the stretch between `focus()`
 * and the `commit()` that ends it, so a controlled parent that ignores every
 * keystroke (it gets none — see the header) cannot stomp a draft the way a
 * per-keystroke-controlled `Input` deliberately lets it.
 */
export function useNumberInputState({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step,
}: NumberInputStateOptions): NumberInputState {
  const [committed, setCommitted] = useControllableState<number | null>(
    value,
    defaultValue,
    onValueChange,
  );
  const [text, setTextState] = React.useState(() => formatValue(committed));
  const editing = React.useRef(false);

  React.useEffect(() => {
    if (!editing.current) setTextState(formatValue(committed));
  }, [committed]);

  const setText = React.useCallback((next: string) => {
    editing.current = true;
    setTextState(next);
  }, []);

  const focus = React.useCallback(() => {
    editing.current = true;
  }, []);

  const applyCommit = React.useCallback(
    (next: number | null) => {
      editing.current = false;
      setCommitted(next);
      setTextState(formatValue(next));
    },
    [setCommitted],
  );

  const commit = React.useCallback(() => {
    const parsed = parseNumber(text);
    applyCommit(parsed === null ? null : clamp(parsed, min, max));
  }, [text, min, max, applyCommit]);

  const stepBy = React.useCallback(
    (direction: NumberInputStepDirection, multiplier = 1) => {
      applyCommit(stepValue(committed, direction, step * multiplier, min, max));
    },
    [committed, step, min, max, applyCommit],
  );

  const setValue = React.useCallback(
    (next: number) => {
      applyCommit(clamp(next, min, max));
    },
    [min, max, applyCommit],
  );

  return React.useMemo(
    () => ({ text, setText, value: committed, focus, commit, stepBy, setValue }),
    [text, setText, committed, focus, commit, stepBy, setValue],
  );
}
