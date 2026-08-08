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
