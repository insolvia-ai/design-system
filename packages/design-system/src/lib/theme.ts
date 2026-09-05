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
 * Theme overrides: colours per scheme, plus the scheme-independent brand
 * decisions the base theme declines to make.
 *
 * Colour keys are semantic role names (`primary`, `bg`, `ink`, `muted`,
 * `line`, `card`, `danger`, …) — never raw palette names, which this package
 * does not expose in either direction. Values are anything React Native
 * accepts as a colour.
 *
 * Partial by design throughout: supply only what you are changing and the rest
 * falls through to the defaults. Note that derived states (`primaryHover`,
 * `primaryActive`, …) are pre-computed values rather than live blends on
 * native, so overriding `primary` alone does NOT move them — override them
 * explicitly if they matter. On web they follow automatically, because there
 * they really are `color-mix()` over the base.
 *
 * `radii` and `fonts` exist because the base theme states no corner and no
 * display face, on the reasoning that both are brand decisions. That left a
 * web consumer able to make them (`--radius-md`, `--font-heading`) and a React
 * Native consumer unable to make them at all: the native leaves read those
 * tokens straight out of `@insolvia-ai/tokens` into `StyleSheet.create`, which
 * runs once at module load and no context can reach. They are read at render
 * time now, like colours.
 */
export interface ThemeOverrides {
  // `| undefined` on every member is required, not noise:
  // `exactOptionalPropertyTypes` is on, so without it a caller cannot pass
  // through a possibly-absent half — which is exactly what `ThemeProvider`
  // does when it re-wraps `theme`.
  readonly light?: Readonly<Record<string, string>> | undefined;
  readonly dark?: Readonly<Record<string, string>> | undefined;
  /**
   * Corner radii, by token name (`none`, `xs`, `sm`, `md`, `lg`, `pill`), in
   * density-independent pixels.
   *
   * NOT nested under a scheme, unlike the colours above, because a corner does
   * not change with the colour scheme — and that is not an assumption, it is
   * what the web side already does: `styles/theme.css` declares `--radius-*`
   * once in `@theme`, and its `[data-theme='dark']` block redefines colours
   * and nothing else. A per-scheme radius here would be a seam the two
   * platforms do not share.
   *
   * The base theme sets every radius except `pill` to 0, deliberately — a
   * corner is a brand decision and the default theme makes none. `{ md: 8 }`
   * is how a native consumer makes one.
   *
   * `pill` is the one step this cannot move, and passing it is a no-op. The
   * components that use it are drawing a SHAPE — a Switch capsule, an Avatar
   * circle, a Progress track — rather than rounding a corner, and a re-brand
   * that wanted rounder cards has never meant it wanted a rectangular switch.
   */
  readonly radii?: Readonly<Record<string, number>> | undefined;
  /**
   * Type families, by role (`heading`, `mono`).
   *
   * ONE family name, never a CSS stack: React Native resolves a single
   * registered family and silently falls back to the system sans for anything
   * it cannot match, so `'Spectral, Georgia, serif'` here renders as neither.
   * The family has to be registered in the consumer's own app bundle first —
   * this package ships no font file and cannot (see
   * `lib/native-typography.native.ts`).
   *
   * `body` is deliberately absent. The native leaves have never set a family
   * for body copy — the platform's own sans renders, which is what
   * `--font-body`'s stack asks for too — so accepting one here would be a
   * visual change to every existing native surface rather than a seam.
   */
  readonly fonts?: Readonly<Record<string, string>> | undefined;
}

const ThemeContext = React.createContext<ThemeOverrides>({});

/**
 * Override the theme for every design-system component below this point.
 *
 * ```tsx
 * <ThemeProvider
 *   theme={{
 *     light: { primary: '#155E63' },
 *     dark: { primary: '#7FD1D9' },
 *     radii: { md: 8 },
 *     fonts: { heading: 'Spectral_600SemiBold' },
 *   }}
 * >
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
  // Memoised on the members rather than on `theme`, so a caller passing an
  // inline object literal — which is the obvious way to write it, and the way
  // the doc comment above shows — does not re-render every themed leaf on every
  // parent render.
  const value = React.useMemo<ThemeOverrides>(
    () => ({ light: theme.light, dark: theme.dark, radii: theme.radii, fonts: theme.fonts }),
    [theme.light, theme.dark, theme.radii, theme.fonts],
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
