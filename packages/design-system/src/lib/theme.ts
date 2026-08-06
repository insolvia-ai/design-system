// SHARED — `react` only. No react-native, no react-dom, no tokens.
//
// The override seam for theming.
//
// ── The asymmetry this closes ────────────────────────────────────────────────
//
// Web consumers have always been able to re-theme this package: `theme.css`
// emits semantic CSS custom properties, and overriding `--color-primary` after
// importing it moves every `.web` leaf at once, derived hover/active states
// included (they are `color-mix()` over the base).
//
// The `.native` leaves had no equivalent. They read `colors` out of
// `@insolvia-ai/tokens` directly, which is a hard-coded default with no seam:
// a React Native consumer could not change a single value without forking the
// package. So the package was themeable on one platform and branded on the
// other, which is not a design system — it is a design system and a skin.
//
// `ThemeProvider` is that seam. Wrap a native tree in it and every leaf below
// picks up the overrides at render time, through the same `useNativeColors()`
// the leaves already call.
//
// ── Why overrides are a loose `Record`, not a typed `ColorScheme` ────────────
//
// Typing this against `@insolvia-ai/tokens`' `ColorScheme` would need an import
// of that package — even `import type` has to resolve for a consumer's
// typecheck — and this package DELIBERATELY does not declare tokens as a
// dependency, so that a web consumer is never forced to install a token
// package whose values it reaches through CSS instead. A hard type here would
// buy autocomplete and charge every web consumer an install.
//
// The practical loss is small: an unknown key is ignored rather than rejected.
// The native merge is still fully typed at the point that matters — see
// `native-theme.native.ts`, which returns a complete `ColorScheme`.
//
// ── Why this file is shared, not a `.native` leaf ────────────────────────────
//
// It imports no renderer, so both platforms resolve it. Web consumers can wrap
// their tree in `ThemeProvider` harmlessly — nothing on the web side reads it,
// because CSS custom properties already did the job — which means a
// cross-platform consumer writes ONE provider rather than branching on
// platform. That symmetry is the point.
import * as React from 'react';

/**
 * Semantic colour overrides, per scheme.
 *
 * Keys are semantic role names (`primary`, `bg`, `ink`, `muted`, `line`,
 * `card`, `danger`, …) — never raw palette names, which this package does not
 * expose in either direction. Values are anything React Native accepts as a
 * colour.
 *
 * Partial by design: supply only the roles you are changing and the rest fall
 * through to the defaults. Note that derived states (`primaryHover`,
 * `primaryActive`, …) are pre-computed values rather than live blends on
 * native, so overriding `primary` alone does NOT move them — override them
 * explicitly if they matter. On web they follow automatically, because there
 * they really are `color-mix()` over the base.
 */
export interface ThemeOverrides {
  // `| undefined` on both is required, not noise: `exactOptionalPropertyTypes`
  // is on, so without it a caller cannot pass through a possibly-absent half —
  // which is exactly what `ThemeProvider` does when it re-wraps `theme`.
  readonly light?: Readonly<Record<string, string>> | undefined;
  readonly dark?: Readonly<Record<string, string>> | undefined;
}

const ThemeContext = React.createContext<ThemeOverrides>({});

/**
 * Override semantic colours for every design-system component below this point.
 *
 * ```tsx
 * <ThemeProvider theme={{ light: { primary: '#155E63' }, dark: { primary: '#7FD1D9' } }}>
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * Nesting is supported and the nearest provider wins outright — overrides are
 * NOT merged down the tree. Shallow merging would make the effective palette at
 * any point a function of the whole ancestor chain, which is much harder to
 * reason about than "this subtree uses this theme".
 */
export function ThemeProvider({
  theme,
  children,
}: {
  theme: ThemeOverrides;
  children: React.ReactNode;
}) {
  // Memoised on the two halves rather than on `theme`, so a caller passing an
  // inline object literal — which is the obvious way to write it, and the way
  // the doc comment above shows — does not re-render every themed leaf on every
  // parent render.
  const value = React.useMemo<ThemeOverrides>(
    () => ({ light: theme.light, dark: theme.dark }),
    [theme.light, theme.dark],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

/**
 * The overrides in scope. Empty when no `ThemeProvider` is present, which is
 * the default and means "use the package's own tokens".
 *
 * Components should not call this directly — `useNativeColors()` composes it
 * with the defaults and is what the `.native` leaves use.
 */
export function useThemeOverrides(): ThemeOverrides {
  return React.useContext(ThemeContext);
}
