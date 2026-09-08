// SHARED — imports `react` and `../lib/controllable` only. No react-dom, no
// react-native. BottomNav's entire behaviour model: which destination is
// active (controlled or uncontrolled, via the shared `useControllableState`
// helper) and the two display knobs — `showLabels` and the RTL-agnostic
// nothing-else — both leaves read from one context. Mirrors `tabs.props.ts`'s
// shape, minus the id-composition rule: a bottom nav item never needs a DOM
// id pair, because it names itself (`aria-current`/`accessibilityLabel`) and
// controls no separate panel.
//
// `defaultValue` is REQUIRED, for the identical reason Tabs' is: there is no
// reliable "first item" for `Root` to discover on its own — `Item`'s siblings
// are the caller's, not introspected here — so an uncontrolled Root given
// nothing would start with no destination selected and no tap could return it
// to that state. Requiring a seed is the simplest behaviour that is always
// correct.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

/**
 * Whether a non-selected item's label is drawn.
 *
 * `'always'` is Material's convention for three-to-five items with short
 * labels — every item names itself all the time, which is also what keeps
 * every item legible before it is ever pressed. `'selected'` hides an
 * unselected item's label (Material calls this "unlabeled" mode) for a nav
 * carrying more visual weight per icon; the label is never actually removed
 * from the DOM/tree, only visually hidden, so the accessible name survives
 * either way — see each leaf for how.
 */
export type BottomNavLabels = 'always' | 'selected';

export interface BottomNavRootContextValue {
  /** The selected item's value. */
  value: string;
  setValue: (next: string) => void;
  showLabels: BottomNavLabels;
}

export const BottomNavRootContext = React.createContext<BottomNavRootContextValue | null>(null);

export function useBottomNavRootContext(part: string): BottomNavRootContextValue {
  const ctx = React.useContext(BottomNavRootContext);
  if (!ctx) throw new Error(`BottomNav.${part} must be rendered inside <BottomNav.Root>`);
  return ctx;
}

export interface BottomNavRootOwnProps {
  /** The selected item's value. Supplying this makes BottomNav controlled —
   * pair it with `onValueChange` and update it yourself in response. */
  value?: string | undefined;
  /**
   * The item selected on first render, AND the seed `useControllableState`
   * needs even in controlled mode. Required — see the file header for why an
   * auto-selected "first item" is not on offer.
   */
  defaultValue: string;
  /** Fires with the value of the newly selected item, in both modes. */
  onValueChange?: ((next: string) => void) | undefined;
  /** Whether an unselected item's label is drawn. Defaults to `'always'`. */
  showLabels?: BottomNavLabels | undefined;
  /**
   * The accessible name for the web `<nav>` landmark (and its native
   * `role="navigation"` counterpart — see the native leaf). Defaults to
   * `'Primary'`, `NavBar`'s own default one level up the hierarchy being
   * `'Main'`: a page can carry both landmarks at once and a screen-reader
   * user switching between them needs two different names to tell them apart.
   */
  label?: string | undefined;
  /**
   * Pins the bar to the bottom of the viewport (web: `position: fixed`;
   * native: `position: 'absolute'`, anchored to its nearest positioned
   * ancestor) instead of sitting in normal flow. Defaults to `false` — an
   * embedded/story context wants the bar in flow, a real phone screen wants
   * it pinned.
   */
  fixed?: boolean | undefined;
  /**
   * Extra bottom padding, in the same pixel/point units both leaves already
   * use, for the home indicator or on-screen nav bar a real device draws
   * under this bar. Defaults to `0`.
   *
   * WHY THIS IS A PROP AND NOT SOMETHING EITHER LEAF RESOLVES ON ITS OWN. The
   * web leaf reaches the real value for free — CSS `env(safe-area-inset-
   * bottom)`, folded into this prop's value when `fixed` — but React Native
   * core ships NO safe-area API at all; reading the real inset needs a
   * dependency this package cannot take (see `packages/design-system/CLAUDE.md`
   * on why `react-native` itself is already the only native import this
   * package allows, let alone a second library on top of it). So the value
   * has to arrive from OUTSIDE: a native consumer already holds it, from
   * `react-native-safe-area-context` or equivalent, and passes it straight
   * through. Keeping the prop on the shared surface (rather than, say, a
   * native-only `safeAreaBottom`) is what lets one story thread one value to
   * both leaves — see `workbench/bottom-nav.stories.tsx`'s `WithInset`.
   */
  insetBottom?: number | undefined;
}

/**
 * The selected-item state machine — pure React, identical on both platforms.
 * Controlled when `value` is supplied, uncontrolled otherwise.
 */
export function useBottomNavState(
  value: string | undefined,
  defaultValue: string,
  onValueChange: ((next: string) => void) | undefined,
  showLabels: BottomNavLabels,
): BottomNavRootContextValue {
  const [current, setCurrent] = useControllableState(value, defaultValue, onValueChange);
  return React.useMemo(
    () => ({ value: current, setValue: setCurrent, showLabels }),
    [current, setCurrent, showLabels],
  );
}

export interface BottomNavItemOwnProps {
  /** This item's identity — matched against `Root`'s `value`/`defaultValue`. */
  value: string;
  /**
   * The destination's name. Required, and always present in the render tree
   * on both leaves even when hidden (`showLabels: 'selected'` on an
   * unselected item) — see each leaf for how it stays visible to assistive
   * tech while hidden from sight.
   */
  label: string;
  /**
   * The destination's glyph. Required — a bottom nav that carries no icons is
   * a plain tab bar (this package's `Tabs`), not this component: Material's
   * Bottom Navigation is icon-first, and an item that skipped its icon would
   * be indistinguishable from a `Tabs.Tab` wearing the wrong a11y role.
   * Decorative on both leaves (the item's own accessible name is `label`,
   * not the icon) — wrapped `aria-hidden`/`accessible={false}` by the leaf,
   * never by the caller.
   */
  icon: React.ReactNode;
  /** Disables the item: no press, no focus, no selection. */
  disabled?: boolean | undefined;
}
