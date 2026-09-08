// SHARED — `react`, `../lib/controllable` and `../input/input.props` only. No
// react-dom, no react-native.
//
// WHY THIS IS ITS OWN COMPONENT AND NOT A PROP ON INPUT. `Input` already
// accepts `type="password"` (`isSecureType`, `../input/input.props`) and hides
// what it holds — that much is a spelling of `type`, the same as `email` or
// `tel`. What it has no way to do is show it back. A reveal control is a
// SECOND focusable element with its own accessible name and pressed state, and
// its own a11y contract (`aria-pressed`, a label that flips with the state) —
// not a variant of `type`, so it earns a leaf pair of its own rather than an
// `Input` prop that would bolt somebody else's a11y contract onto Input's.
//
// The reveal state is controlled/uncontrolled exactly like the text itself —
// `useControllableState`, the same primitive `useInputState` (imported from
// Input, not reimplemented) already uses for the text — so a "show password"
// checkbox elsewhere on a form can drive it exactly as a controlled `value`
// drives the text.
import { useControllableState } from '../lib/controllable';
import { autoCompleteFor } from '../input/input.props';

/**
 * The one place a password field should invite a password manager. There is
 * no `'off'` value here — `current-password` asks the manager to FILL a saved
 * credential, `new-password` (sign-up, change-password) asks it to OFFER a
 * strong generated one instead, and a password field that refuses both is a
 * field fighting the one tool that keeps its user's password long and unique.
 * That is why `autoCompleteFor` maps `password` to `'current-password'` rather
 * than leaving it `undefined` the way `search` does — this component picks up
 * that same default below, so the two cannot disagree about it.
 */
export type PasswordInputAutoComplete = 'current-password' | 'new-password';

/**
 * The default this component falls back to when a caller does not name one —
 * read off `Input`'s own `type="password"` mapping rather than restated, so a
 * future change to that mapping cannot leave the two components disagreeing
 * about what "the password default" means.
 */
export const DEFAULT_AUTO_COMPLETE: PasswordInputAutoComplete =
  (autoCompleteFor.password as PasswordInputAutoComplete | undefined) ?? 'current-password';

export const DEFAULT_SHOW_LABEL = 'Show password';
export const DEFAULT_HIDE_LABEL = 'Hide password';

export interface PasswordInputOwnProps {
  // `| undefined` on every optional: `exactOptionalPropertyTypes` is on, and
  // without it a leaf cannot spread a possibly-undefined prop through — same
  // note as input.props.ts.
  /** Controlled text. Pair with `onValueChange`. */
  value?: string | undefined;
  /** Uncontrolled starting text. */
  defaultValue?: string | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  placeholder?: string | undefined;
  /** Submitted name. Falls back to the surrounding Field's `name`. */
  name?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  /**
   * Marks the control invalid on its own — independent of the `invalid` a
   * surrounding `Field.Root` may set. Either one is enough.
   */
  invalid?: boolean | undefined;
  /** What kind of password manager help this field asks for. See the type. */
  autoComplete?: PasswordInputAutoComplete | undefined;

  /** Uncontrolled starting reveal state. */
  defaultRevealed?: boolean | undefined;
  /** Controlled reveal state — pair with `onRevealedChange`. */
  revealed?: boolean | undefined;
  /**
   * Fires whenever the reveal state changes, from EITHER the toggle button or
   * a controlled caller re-rendering with a new `revealed`. Lets a "show
   * password" checkbox elsewhere on the form drive this field's toggle.
   */
  onRevealedChange?: ((next: boolean) => void) | undefined;

  /** Accessible name for the toggle while hidden. @default 'Show password' */
  showLabel?: string | undefined;
  /** Accessible name for the toggle while revealed. @default 'Hide password' */
  hideLabel?: string | undefined;
}

/**
 * The reveal state. Lives here, not in each leaf, for the same reason
 * `useInputState` lives in `input.props.ts`: two leaves inventing their own
 * controlled/uncontrolled split can drift, one hook cannot.
 */
export function useRevealedState({
  revealed,
  defaultRevealed = false,
  onRevealedChange,
}: Pick<PasswordInputOwnProps, 'revealed' | 'defaultRevealed' | 'onRevealedChange'>): [
  boolean,
  (next: boolean) => void,
] {
  return useControllableState<boolean>(revealed, defaultRevealed, onRevealedChange);
}
