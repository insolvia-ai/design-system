/**
 * The colour scheme both leaves render under, as a tiny external store.
 *
 * ── Why a store, and not a `matchMedia` patch ────────────────────────────────
 *
 * The two leaves learn the scheme by completely different routes:
 *
 *   .web    — `theme.css` toggles on `data-theme="dark"` at a root element.
 *   .native — `useNativeColors()` → RN's `useColorScheme()` → react-native-web,
 *             whose `Appearance` module does `var query = matchMedia(...)` ONCE
 *             AT MODULE LOAD and keeps that object forever. It exposes
 *             `getColorScheme` and `addChangeListener` — no setter.
 *
 * The obvious approach is to patch `window.matchMedia` before react-native-web
 * is evaluated. That was tried and it does not work here: Storybook injects
 * `.storybook/preview-head.html` AFTER its own module scripts (measured — the
 * head script landed 6th, with a module script 1st), so react-native-web has
 * already latched the real query object. There is no config hook that reliably
 * runs earlier, and a fix that depends on script order would be one refactor
 * away from silently regressing.
 *
 * So the platform is substituted instead of the media query. `workbench/react-native.ts`
 * re-exports react-native-web with its own `useColorScheme` bound to this
 * store, and `.storybook/main.ts` aliases `react-native` to it. Order-independent,
 * and honest about what it is: the workbench already substitutes the platform
 * (react-native-web IS a substitute), so substituting one more export of it is
 * the same trick one level down.
 *
 * ── Why this matters enough to be worth the machinery ────────────────────────
 *
 * 0.2.1 shipped all six native leaves reading `colors.light` at module load, so
 * every design-system surface stayed light inside a dark app. Nothing catches
 * that but looking at both schemes, one toolbar click apart. A scheme switch
 * that moved the page and the web leaf while leaving the native leaf behind
 * would be worse than none at all — it would look exactly like that bug, and
 * send the next person hunting a component that is fine.
 */

export type Scheme = 'light' | 'dark';

let current: Scheme = 'light';
const listeners = new Set<() => void>();

/** For `useSyncExternalStore` in the react-native shim. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** For `useSyncExternalStore` in the react-native shim. */
export function getScheme(): Scheme {
  return current;
}

/**
 * Apply a scheme to both leaves. Safe to call on every render: the DOM
 * attributes are idempotent and subscribers are only notified on a real change.
 */
export function applyScheme(scheme: Scheme): void {
  // The web half — `theme.css` keys off this attribute. Set unconditionally so
  // the very first call paints correctly.
  const root = document.documentElement;
  root.dataset['theme'] = scheme;
  // Lets the browser theme form controls and scrollbars to match.
  root.style.colorScheme = scheme;

  if (scheme === current) return;
  current = scheme;

  // The native half — every `useColorScheme()` in the tree re-reads the store.
  for (const listener of listeners) listener();
}
