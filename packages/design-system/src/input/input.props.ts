// SHARED — `react` and `../lib/controllable` only. No react-dom, no
// react-native.
//
// The text-entry contract both leaves execute: the controlled/uncontrolled
// split, the size scale, and the mapping from a web `type` to the native
// keyboard that means the same thing. Everything that renders — an `<input>`
// against a `TextInput` — stays in the leaves.
import { useControllableState } from '../lib/controllable';

/**
 * The input kinds this package supports on BOTH platforms.
 *
 * `number` IS here. It was left out at first on the grounds that a spinner has
 * no React Native counterpart and that `<input type="number">` carries real
 * traps — scroll-to-change, and `.value` going empty on a bad character. Those
 * traps are real but they are not a reason to make callers hand-roll it: a
 * numeric field is one of the four or five inputs every form needs, and the
 * scroll trap is two lines to disarm (the web leaf blurs on wheel). On native
 * it is simply the numeric keypad, which is the whole point on a phone.
 *
 * WHAT IS STILL ABSENT, and why — each of these is a component or a native
 * module, not a `type`:
 *
 * - `date`, `time`, `datetime-local` — `DateInput` owns typed dates and
 *   `Calendar` owns picked ones. The reasoning is at the top of
 *   `date-input.props.ts`; a second, differently-behaved date control reached
 *   through a string prop would undo it.
 * - `file` — React Native has no file input at all. It needs a document-picker
 *   native module, which this package cannot declare (see the dependency rule
 *   in CLAUDE.md).
 * - `range` — a slider. RN has no built-in one, and a slider is its own
 *   component with its own keyboard grammar, not a text field wearing a hat.
 * - `color` — needs a colour picker; same story as `file`.
 */
export type InputType = 'text' | 'number' | 'email' | 'password' | 'search' | 'tel' | 'url';

export type InputSize = 'sm' | 'md' | 'lg';

/**
 * `md` is 44px — the WCAG 2.5.5 target-size floor, the same height
 * `DateInput` and the Select trigger already hold. `sm` is a deliberate opt-in
 * to a smaller target for dense forms, exactly as `Button`'s `sm` is.
 */
export const sizeStyles: Record<InputSize, string> = {
  sm: 'h-9 px-sm text-sm',
  md: 'h-11 px-sm text-sm',
  lg: 'h-12 px-md text-base',
};

export const sizeHeight: Record<InputSize, number> = { sm: 36, md: 44, lg: 48 };

/**
 * The native keyboard for a web `type`.
 *
 * This is the whole reason `type` is shared data rather than a web-leaf prop:
 * a React Native consumer typing an email address should get the `@` key, and
 * that only happens if the two leaves agree on what `type="email"` MEANS. The
 * web leaf spells the same intent with `type` plus `inputMode`.
 */
export const keyboardTypeFor: Record<
  InputType,
  'default' | 'email-address' | 'phone-pad' | 'url' | 'numeric'
> = {
  text: 'default',
  // `numeric`, not `number-pad`: it keeps the minus sign and the decimal
  // separator, which `number-pad` drops — and a field that cannot accept
  // "-12.5" is not a number field.
  number: 'numeric',
  email: 'email-address',
  password: 'default',
  search: 'default',
  tel: 'phone-pad',
  url: 'url',
};

/** Password is the one type that hides what it holds. */
export function isSecureType(type: InputType): boolean {
  return type === 'password';
}

/**
 * Autocomplete hints, shared so the two platforms ask the password manager for
 * the same thing. RN's `autoComplete` accepts these tokens too, which is the
 * only reason one map can serve both.
 */
export const autoCompleteFor: Record<InputType, string | undefined> = {
  text: undefined,
  number: undefined,
  email: 'email',
  password: 'current-password',
  search: undefined,
  tel: 'tel',
  url: 'url',
};

export interface InputOwnProps {
  // `| undefined` on every optional is required, not noise:
  // `exactOptionalPropertyTypes` is on, and without it a leaf cannot spread a
  // possibly-undefined prop through. Same note as select.props.ts.
  /** Controlled text. Pair with `onValueChange`. */
  value?: string | undefined;
  /** Uncontrolled starting text. */
  defaultValue?: string | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  type?: InputType | undefined;
  size?: InputSize | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  /**
   * Marks the control invalid on its own — independent of the `invalid` a
   * surrounding `Field.Root` may set. Either one is enough.
   */
  invalid?: boolean | undefined;
  /** Submitted name. Falls back to the surrounding Field's `name`. */
  name?: string | undefined;
}

/**
 * The text state. One line of substance, but it lives here rather than in each
 * leaf so neither can invent its own controlled/uncontrolled split — the whole
 * point of `lib/controllable`.
 */
export function useInputState({
  value,
  defaultValue = '',
  onValueChange,
}: Pick<InputOwnProps, 'value' | 'defaultValue' | 'onValueChange'>): [
  string,
  (next: string) => void,
] {
  return useControllableState<string>(value, defaultValue, onValueChange);
}
