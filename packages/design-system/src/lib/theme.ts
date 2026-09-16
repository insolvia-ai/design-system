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
// ── The second asymmetry, and why `scheme` is here ───────────────────────────
//
// Which scheme a web consumer paints has always been theirs to say:
// `theme.css` keys its dark values off `[data-theme='dark']`, so a switch in
// the app writes one attribute and every `.web` leaf follows.
//
// The `.native` leaves had no equivalent for that either. They resolve their
// colours from `useColorScheme()`, which reports the OS and nothing else —
// and react-native-web 0.21, the renderer a React Native consumer's users
// actually meet them in, ships no `Appearance.setColorScheme` to move it. So
// an app offering an in-app light/dark switch could re-paint its own surfaces
// and not one control from this package.
//
// `ThemeProvider`'s `scheme` prop is that seam, and it stops at the native
// leaves on purpose: on web `[data-theme]` already is the seam, and it belongs
// to the consumer's own head script, which has to run before first paint.
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
   * Type families, by role (`heading`, `body`, `mono`).
   *
   * ONE family name, never a CSS stack: React Native resolves a single
   * registered family and silently falls back to the system sans for anything
   * it cannot match, so `'Spectral, Georgia, serif'` here renders as neither.
   * The family has to be registered in the consumer's own app bundle first —
   * this package ships no font file and cannot (see
   * `lib/native-typography.native.ts`).
   *
   * `body` reaches every text a leaf renders that is not a heading or mono —
   * Button and Chip labels, Field labels, descriptions and errors, Table
   * cells, the text inside Input, Textarea, Combobox and DateInput, Tabs,
   * Toast, Tooltip, and so on. It has no default of its own: with no override
   * the native leaves set no body family at all, so the platform's own sans
   * renders — which is what `--font-body`'s stack asks for, and exactly what
   * every surface rendered before this seam existed. The one carve-out is a
   * glyph drawn in a fixed box (a dismiss ×, a chevron, a tick), which keeps
   * the platform face.
   */
  readonly fonts?: Readonly<Record<string, string>> | undefined;
}

/**
 * The two colour schemes this package paints. Narrower than React Native's
 * `useColorScheme()`, which also returns `null` and `'unspecified'`: those mean
 * "the OS has no opinion", and this type is a consumer stating one.
 */
export type ThemeScheme = 'light' | 'dark';

/**
 * What is in scope below a `ThemeProvider` — the overrides it was given, plus
 * the scheme it forced, if any.
 *
 * A separate type from `ThemeOverrides` on purpose, so `scheme` has exactly ONE
 * spelling. It is a prop of `ThemeProvider`, not a member of `theme`: the theme
 * is a brand, chosen once and static, while the scheme is application state
 * that changes when a user flips a switch. Were `scheme` a member of
 * `ThemeOverrides` as well, `theme={{ scheme: 'dark' }}` would typecheck and do
 * nothing.
 */
export interface ThemeInScope extends ThemeOverrides {
  readonly scheme?: ThemeScheme | undefined;
}

const ThemeContext = React.createContext<ThemeInScope>({});

/**
 * Override the theme for every design-system component below this point.
 *
 * ```tsx
 * <ThemeProvider
 *   theme={{
 *     light: { primary: '#155E63' },
 *     dark: { primary: '#7FD1D9' },
 *     radii: { md: 8 },
 *     fonts: { heading: 'Spectral_600SemiBold', body: 'Inter_400Regular' },
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
  scheme,
  children,
}: {
  theme: ThemeOverrides;
  /**
   * Force the colour scheme every `.native` leaf below this point resolves
   * its colours for, instead of following the OS.
   *
   * Absent — the default — is byte-for-byte the behaviour that came before it:
   * the leaves take `useColorScheme()`, the OS setting on a device and
   * `prefers-color-scheme` when rendered on web through react-native-web.
   *
   * This exists so an in-app light/dark switch can reach these components at
   * all. A React Native consumer that offers one has no other way to move
   * them: react-native-web 0.21 ships no `Appearance.setColorScheme`, so an
   * app could re-paint its own surfaces and leave every control from this
   * package on the OS setting — one screen, two schemes.
   *
   * Nesting follows the same rule as the overrides: the NEAREST provider wins
   * outright, so an inner provider that names no scheme returns its subtree to
   * the OS rather than inheriting the outer one's.
   *
   * **A no-op on web, by design.** The `.web` leaves read no context — their
   * override seam is CSS, and their scheme seam is `[data-theme]` on the
   * document element, which the consumer's own SSR/head script owns because it
   * has to run before first paint to avoid a flash. This prop deliberately
   * does not write that attribute: a component that did would be fighting the
   * script that already set it.
   */
  scheme?: ThemeScheme | undefined;
  children: React.ReactNode;
}) {
  // Memoised on the members rather than on `theme`, so a caller passing an
  // inline object literal — which is the obvious way to write it, and the way
  // the doc comment above shows — does not re-render every themed leaf on every
  // parent render.
  const value = React.useMemo<ThemeInScope>(
    () => ({
      light: theme.light,
      dark: theme.dark,
      radii: theme.radii,
      fonts: theme.fonts,
      scheme,
    }),
    [theme.light, theme.dark, theme.radii, theme.fonts, scheme],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

/**
 * The overrides in scope, and the scheme forced over them if a provider named
 * one. Empty when no `ThemeProvider` is present, which is the default and means
 * "use the package's own tokens, in the OS's scheme".
 *
 * The forced scheme rides on this hook rather than one of its own so that a
 * leaf reads the whole theme in scope in a single context — one subscription,
 * and no way for the two halves to disagree about which provider is nearest.
 *
 * Components should not call this directly — `useNativeColors()` composes it
 * with the defaults and is what the `.native` leaves use.
 */
export function useThemeOverrides(): ThemeInScope {
  return React.useContext(ThemeContext);
}
