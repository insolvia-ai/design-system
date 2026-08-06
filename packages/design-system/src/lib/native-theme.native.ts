// NATIVE-side theme resolution — the one piece every .native leaf shares. The
// `.native.` infix puts this file on the platform-leaf side of the package's
// fence: Metro and tsconfig.native.json's moduleSuffixes resolve it, no web
// resolver ever can, and eslint.config.js exempts exactly this pattern from the
// renderer ban that fences the SHARED lib modules — so importing react-native
// here is the leaf privilege, not a hole.
//
// Why a hook at all: a StyleSheet.create block runs once at module load, so a
// color baked into it (or into a module-level `colors.light`) can never follow
// the OS scheme — that was the 0.2.1 dark-mode regression. Leaves keep layout
// static in StyleSheet.create and apply colors from this hook at render time.
import { useColorScheme } from 'react-native';

import { colors, type ColorScheme } from '@insolvia-ai/tokens';

import { useThemeOverrides, type ThemeOverrides } from './theme';

/** Anything but `'dark'` is light. See `nativeColorsFor`. */
type SchemeName = 'light' | 'dark';

function schemeName(scheme: string | null | undefined): SchemeName {
  return scheme === 'dark' ? 'dark' : 'light';
}

/**
 * The package's own semantic colors for a scheme name, with no overrides
 * applied. **Anything but `'dark'` resolves to light** — and for the same
 * reason the parameter is a plain `string`: React Native's `useColorScheme()`
 * can return `'unspecified'` as well as `null`, and an unknown input must take
 * the safe arm rather than crash or go dark.
 */
export function nativeColorsFor(scheme: string | null | undefined): ColorScheme {
  return colors[schemeName(scheme)];
}

/**
 * The package's colors for a scheme, with a consumer's overrides merged over
 * the top.
 *
 * Exported for testing and for a consumer doing its own resolution outside a
 * React tree; components use `useNativeColors()`.
 */
export function nativeColorsWith(
  scheme: string | null | undefined,
  overrides: ThemeOverrides,
): ColorScheme {
  const name = schemeName(scheme);
  const base = colors[name];
  const patch = overrides[name];

  // Identity when there is nothing to apply, so the overwhelmingly common
  // un-themed case returns the shared frozen token object rather than a fresh
  // one on every render — which would defeat every `React.memo` and
  // dependency-array comparison downstream.
  if (patch === undefined) return base;

  // Unknown keys are ignored rather than rejected: `ThemeOverrides` is
  // deliberately a loose Record (it cannot reference the tokens package's
  // types — see lib/theme.ts), so the cast is where that looseness is paid
  // for, and it is contained to this one line. Spreading a partial patch over
  // a complete base cannot produce a partial result.
  return { ...base, ...patch } as ColorScheme;
}

/**
 * The semantic colors for the ACTIVE scheme, honouring any `ThemeProvider`
 * above this component — the OS setting on native, `prefers-color-scheme` when
 * rendered on web through react-native-web.
 *
 * This is the seam that makes the native leaves themeable at all. Before it,
 * they read the token defaults directly and a consumer could not change a
 * colour without forking the package, while web consumers had been able to
 * re-theme via CSS custom properties all along.
 */
export function useNativeColors(): ColorScheme {
  return nativeColorsWith(useColorScheme(), useThemeOverrides());
}
