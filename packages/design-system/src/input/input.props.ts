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
 * Deliberately short of HTML's list. `date` is absent because `DateInput`
 * exists and says why at length; `number` is absent because a spinner control
 * has no React Native counterpart and its browser behaviour (scroll-to-change,
 * silent value loss on a bad character) is the one input type most design
 * systems end up banning anyway — `text` with `inputMode` covers the cases
 * that matter without the traps.
 */
export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

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
export const keyboardTypeFor: Record<InputType, 'default' | 'email-address' | 'phone-pad' | 'url'> =
  {
    text: 'default',
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
