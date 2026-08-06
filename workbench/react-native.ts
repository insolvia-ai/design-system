/**
 * What `react-native` resolves to inside the workbench.
 *
 * `.storybook/main.ts` aliases `react-native` here, ahead of the framework's own
 * alias to `react-native-web`. Everything is re-exported from react-native-web
 * unchanged except `useColorScheme`, which is bound to the workbench's scheme
 * store instead of to a media query.
 *
 * The reason is in `workbench/scheme.ts`: react-native-web's `Appearance` grabs
 * its `MediaQueryList` once, at module load, and there is no way to guarantee a
 * `matchMedia` patch lands before that in Storybook's preview bundle. Replacing
 * the export is order-independent, which a patch can never be.
 *
 * ── The honesty question this raises ─────────────────────────────────────────
 *
 * The native pane is supposed to show what a React Native consumer renders, and this file makes
 * it show something marginally different — one hook swapped. That is a real
 * cost, and it is bounded: `useColorScheme` returns a `'light' | 'dark'` string
 * in both cases, and the design system's `useNativeColors()` treats
 * anything-but-`'dark'` as light, the safe arm for an unknown value. So
 * the value flowing into every leaf is the same shape and the same domain; only
 * its source moved, from the OS to a toolbar.
 *
 * What this does NOT let you check is react-native-web's own scheme plumbing.
 * That is fine — that is react-native-web's code, and this repo does not own it.
 *
 * Nothing else may be added to this shim. Every export replaced here is one
 * more way the native pane can lie about what a consumer renders, and the panes
 * only mean anything while they are honest.
 */
import * as React from 'react';

import { getScheme, subscribe } from './scheme.ts';

export * from 'react-native-web';

/**
 * The workbench's colour scheme, in the shape `react-native` promises.
 *
 * `useSyncExternalStore` rather than `useState` + an effect, so a leaf that
 * mounts after a scheme change still reads the current value on its first
 * render rather than flashing the old one.
 */
export function useColorScheme(): 'light' | 'dark' {
  return React.useSyncExternalStore(subscribe, getScheme, getScheme);
}
