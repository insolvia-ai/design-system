// NATIVE LEAF (src/lib) — the focus ring every native control draws.
//
// WHY THIS FILE EXISTS. The web leaves say `focusRing` from `lib/styles`, one
// string shared by everything. The native side had the same idea implemented
// once, privately, inside `field.native.tsx` — and it stayed there. Every
// other native control fell through to the BROWSER's default focus ring under
// react-native-web: blue, hard against the control, and nothing to do with
// this design system. DateInput, Select, Input, Textarea and Combobox were all
// doing that, which is what a reader noticed in the workbench: the web pane
// ringed in brass, the native pane in Chrome blue.
//
// One control having the fix is worse than none having it, because it makes
// the design look deliberate. So the ring lives here now and Field imports it
// like everyone else.
//
// The `.native.` infix is what exempts this file from the renderer ban in
// eslint.config.js — the same rule that exempts native-theme.native.ts.
import * as React from 'react';
import { type TextStyle } from 'react-native';

import { useNativeColors } from './native-theme';

/**
 * The ring's geometry, minus its colour.
 *
 * Tailwind draws the web ring as two stacked box-shadows: 2px of `--color-bg`
 * hugging the control, then 2px of `--color-accent` — which reads as a 2px gap
 * and then 2px of gold. React Native has no box-shadow, but it has had
 * `outline*` since the style props landed, and `outlineOffset` produces the
 * same gap. The gap is transparent here rather than painted `--color-bg`; on
 * the page background those are the same pixels.
 */
export const nativeFocusRing = {
  outlineStyle: 'solid',
  outlineWidth: 2,
  outlineOffset: 2,
} as const;

/**
 * Cancels the PLATFORM's own focus ring on a control an ANCESTOR rings.
 *
 * A leaf that spreads `ringStyle` on the focusable element itself is already
 * done: its `outlineStyle: 'solid'` replaces whatever the platform would draw.
 * A leaf that draws the box on a WRAPPER — PasswordInput and NumberInput, whose
 * row holds a bare `TextInput` beside a button — is not. Under
 * react-native-web the wrapper got the owned ring and the inner `<input>` kept
 * Chrome's, `outline: auto 1px`, painted INSIDE it: two rings, one of them the
 * browser's default in a colour this package does not own. Spread this on the
 * inner control so only the wrapper's ring paints.
 *
 * It is measurable in a browser and nowhere else. A real click or Tab is what
 * engages Chrome's `:focus-visible` heuristic — a programmatic `.focus()`
 * reports `outline-style: none` and hides the bug — so no jsdom test can see
 * this, and neither could axe, which scores contrast and names, not rings.
 *
 * `outlineWidth: 0` is NOT the fix: Chrome ignores width for an `auto` outline
 * and paints its ring anyway. It has to be `outlineStyle: 'none'`, which RN
 * 0.86's style types do not admit (`'solid' | 'dotted' | 'dashed'`) even though
 * react-native-web forwards it to CSS verbatim — the same platform/type gap the
 * `aria-*` casts in the leaves document. Hence the one contained cast, here
 * rather than repeated per leaf. On a real device this is inert: React Native
 * paints no default ring to cancel.
 *
 * THE CAST LANDS ON `TextStyle`, NOT `ViewStyle`, and that is not cosmetic.
 * Both places this is spread are a `TextInput`'s `style`, which takes
 * `StyleProp<TextStyle>`. A `ViewStyle` satisfies that in THIS repo's programs,
 * where every extra `TextStyle` member is optional — and stops satisfying it in
 * a consumer whose program augments `TextStyle`, which react-native-web's
 * typings do: they widen `userSelect` to `string`, so the two types conflict on
 * a shared member rather than merely differing by optional ones, and the
 * assignment becomes a hard `TS2769` in source this package published. `TextStyle`
 * is the honest type for a value only text controls use, and it stays assignable
 * wherever a `ViewStyle` is wanted, so a future `View` use site still compiles.
 */
export const suppressPlatformFocusRing = { outlineStyle: 'none' } as unknown as TextStyle;

export interface NativeFocusRing {
  focused: boolean;
  /** Call from the control's own `onFocus`, after the caller's handler. */
  focus: () => void;
  /** Call from the control's own `onBlur`. */
  blur: () => void;
  /**
   * The ring style while focused, `null` otherwise — spread late in the style
   * array so a caller's `style` can still override it.
   */
  ringStyle: readonly [typeof nativeFocusRing, { outlineColor: string }] | null;
}

/**
 * Focus state plus the ring to draw for it.
 *
 * The colour resolves at RENDER time from `useNativeColors()`, so the ring
 * follows the scheme like every other native colour — the 0.2.1 rule applies
 * here as much as anywhere.
 */
export function useNativeFocusRing(): NativeFocusRing {
  const [focused, setFocused] = React.useState(false);
  const c = useNativeColors();

  const focus = React.useCallback(() => setFocused(true), []);
  const blur = React.useCallback(() => setFocused(false), []);

  return React.useMemo(
    () => ({
      focused,
      focus,
      blur,
      ringStyle: focused ? ([nativeFocusRing, { outlineColor: c.accent }] as const) : null,
    }),
    [focused, focus, blur, c.accent],
  );
}
