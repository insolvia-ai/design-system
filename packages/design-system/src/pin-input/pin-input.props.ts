// SHARED — `react` and `../lib/controllable` only. No react-dom, no
// react-native.
//
// The one-time-code contract both leaves execute: the controlled/uncontrolled
// split, `onComplete`'s fire-once rule, and the character rules a "digit"
// obeys. Everything that owns FOCUS — which box is active, which element the
// OS puts the cursor in — is a leaf concern, because the two platforms answer
// it with entirely different mechanisms (N real `<input>`s vs. one hidden
// `TextInput` with drawn boxes); see the two leaves' headers for why.
//
// THE VALUE HAS NO GAPS. `value` is always the FILLED PREFIX — its length is
// the number of boxes filled, left to right — never a sparse string with holes
// where an unfilled box would sit. That is what keeps `value` a plain `string`
// (per the public API) rather than a `(string | null)[]`, and it is why every
// function below that takes an `index` CLAMPS it into the prefix rather than
// producing one: a caller focusing box 5 while only 2 are filled still types
// at position 2. A phone's SMS autofill and a person entering a code both fill
// left to right anyway, so the clamp costs nothing in the case this component
// exists for and removes an entire class of "what does box 3 show when box 1
// is empty" bugs the alternative — Chakra's `string[]` — has to answer.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

/**
 * `numeric` accepts `0`–`9` only — the SMS-code case this component is built
 * for. `alphanumeric` accepts `0`–`9` and `a`–`z`/`A`–`Z`, always UPPERCASED
 * (`normalizeChar` below), because a mixed-case code read off a screen or a
 * printed voucher is not case-sensitive in practice and a field that silently
 * distinguishes `A` from `a` invites a real user to retype a correct code.
 */
export type PinInputType = 'numeric' | 'alphanumeric';

/** Whether one character is legal input for `type`. Rejects anything but a single character. */
export function acceptChar(type: PinInputType, ch: string): boolean {
  if (ch.length !== 1) return false;
  return type === 'numeric' ? /[0-9]/.test(ch) : /[0-9a-zA-Z]/.test(ch);
}

/** The stored form of an accepted character — uppercased for `alphanumeric`, untouched otherwise. */
export function normalizeChar(type: PinInputType, ch: string): string {
  return type === 'alphanumeric' ? ch.toUpperCase() : ch;
}

/** Clamp an index into the filled prefix — see the file header's "no gaps" rule. */
function clampToPrefix(value: string, index: number): number {
  return Math.max(0, Math.min(index, value.length));
}

/**
 * Set the character at `index`, clamping into the filled prefix.
 *
 * One formula covers both edits this component ever makes: `index` inside the
 * prefix REPLACES that box's character, and `index` at (or past) the prefix's
 * end APPENDS one — `value.slice(0, at)` is the whole value in the append
 * case, so nothing else has to branch on which one this is.
 */
export function setCharAt(value: string, index: number, ch: string): string {
  const at = clampToPrefix(value, index);
  return value.slice(0, at) + ch + value.slice(at + 1);
}

/**
 * Remove the character at `index`, shifting anything after it left. A no-op
 * past the filled prefix — there is nothing there to delete, which is exactly
 * the case a caller checks before deciding to move focus back instead (see
 * `prevIndex`).
 */
export function deleteAt(value: string, index: number): string {
  if (index < 0 || index >= value.length) return value;
  return value.slice(0, index) + value.slice(index + 1);
}

/**
 * Fold pasted (or SMS-autofilled) text into `value`, starting at `index`.
 * Characters `type` rejects are dropped rather than stopping the paste short —
 * a code copied with a stray space or a hyphen (`123 456`, `123-456`) should
 * still fill the boxes. Empty after filtering leaves `value` untouched, so a
 * paste of something that is not a code at all does not clear the field.
 *
 * Overwrites from `index` onward rather than merging past it: a paste is
 * always "here is the code", never "insert into the middle of what's there".
 */
export function distributePaste(
  value: string,
  index: number,
  pasted: string,
  length: number,
  type: PinInputType,
): string {
  const accepted = Array.from(pasted)
    .filter((ch) => acceptChar(type, ch))
    .map((ch) => normalizeChar(type, ch));
  if (accepted.length === 0) return value;
  const at = clampToPrefix(value, index);
  return (value.slice(0, at) + accepted.join('')).slice(0, length);
}

/** The box after `index`, clamped to the last box. */
export function nextIndex(index: number, length: number): number {
  return Math.min(index + 1, length - 1);
}

/** The box before `index`, clamped to the first box. */
export function prevIndex(index: number): number {
  return Math.max(index - 1, 0);
}

export interface PinInputOwnProps {
  // `| undefined` on every optional: `exactOptionalPropertyTypes` is on, and
  // without it a leaf cannot spread a possibly-undefined prop through — same
  // note as input.props.ts and date-input.props.ts.
  /** How many boxes, and how many characters make a complete code. Defaults to 6. */
  length?: number | undefined;
  /** Controlled value — the filled prefix, `''` through `length` characters long. */
  value?: string | undefined;
  /** Uncontrolled starting value. */
  defaultValue?: string | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  /**
   * Fires exactly once when `value` reaches `length` characters — not on every
   * change once complete, and not again until the code shrinks (a Backspace)
   * and re-completes. A caller wiring this straight to a verification request
   * would otherwise re-submit on a stray re-render or a later prop update that
   * still carries the finished code.
   */
  onComplete?: ((code: string) => void) | undefined;
  /** Which characters are accepted. Defaults to `numeric`. */
  type?: PinInputType | undefined;
  /** Paint each filled box as `•` instead of the real character. */
  mask?: boolean | undefined;
  disabled?: boolean | undefined;
  /**
   * Marks every box invalid on its own — independent of the `invalid` a
   * surrounding `Field.Root` may set. Either one is enough, the same merge
   * `Input` and `PasswordInput` already use.
   */
  invalid?: boolean | undefined;
  /** Submitted name for the web leaf's hidden joined-value input. No native equivalent — see the native leaf header. */
  name?: string | undefined;
  /**
   * Focuses the first box on mount. Defaults to `false`: this is a WHOLE-PAGE
   * decision most components should never make for a caller, and it is
   * reasonable here for exactly one shape of screen — a dedicated "enter the
   * code we texted you" step with nothing else worth focusing first. A code
   * field living inside a longer form should leave this off, the same way no
   * other input in this package grabs focus unasked.
   */
  autoFocus?: boolean | undefined;
  /** The group's accessible name. Defaults to `'Verification code'`. */
  label?: string | undefined;
}

/**
 * The value state, plus the fire-once `onComplete` — one place so neither leaf
 * can drift on either rule. Builds on `useControllableState` exactly as
 * `useInputState` and `useDateInputState` do.
 */
export function usePinInputState({
  length = 6,
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
}: Pick<PinInputOwnProps, 'length' | 'value' | 'defaultValue' | 'onValueChange' | 'onComplete'>): [
  string,
  (next: string) => void,
] {
  const [current, setCurrent] = useControllableState<string>(value, defaultValue, onValueChange);

  // Ref, not a dependency: a caller passing a fresh `onComplete` closure every
  // render (an inline arrow function, the common case) must not re-fire the
  // effect below on every keystroke — only an actual VALUE change should be
  // able to trigger it. Same shape as `onChangeRef` in date-input.props.ts.
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // `completeRef` is what makes this fire ONCE per completion rather than
  // once per render while complete: it flips true the first time `current`
  // reaches `length` and only resets when the code shrinks back below it (a
  // Backspace), so a re-render that leaves a finished code finished does not
  // re-fire.
  const completeRef = React.useRef(false);
  React.useEffect(() => {
    if (current.length >= length) {
      if (!completeRef.current) {
        completeRef.current = true;
        onCompleteRef.current?.(current);
      }
    } else {
      completeRef.current = false;
    }
  }, [current, length]);

  return [current, setCurrent];
}
