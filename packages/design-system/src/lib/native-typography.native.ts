// NATIVE LEAF (src/lib) — the heading family, resolved per platform.
//
// WHY THIS FILE EXISTS. The web leaves say `font-heading`, which resolves to a
// stack in theme.css. React Native cannot take a stack — it resolves exactly
// ONE registered family name — so the native leaves set no `fontFamily` at all
// and rendered the platform UI family while the web surfaces rendered whatever
// the stack asked for. Both leaves claimed to implement one design and
// disagreed about its most visible property.
//
// The base theme no longer ships a display face: `heading` and `body` are the
// same sans stack, because a distinct heading family is a brand decision and
// this package's default theme deliberately makes none. The indirection stays
// anyway. It is what a re-brand needs — point `fonts.heading` at a serif and
// this map is the one place the native leaves have to follow — and collapsing
// it now would mean rediscovering the original bug the next time someone does.
//
// It was invisible to everything: the jsdom tests assert roles and labels, tsc
// reads no CSS, and axe has no opinion about which family a heading uses. Only
// the workbench, showing both panes at once, could surface it.
//
// WHY NO FONT FILE IS SHIPPED. Registering a family in React Native is the
// CONSUMER's job — the font has to be linked into their app bundle (expo-font,
// or the platform project). A package that publishes source with no build step
// cannot do that on their behalf, so bundling a .woff2/.ttf here would fix the
// web pane, leave every device falling back to system, and look fixed. Each
// platform gets the serif it already has instead, which is precisely what the
// web stack asks for too.
//
// The `.native.` infix is what exempts this file from the renderer ban in
// eslint.config.js — the same rule that exempts native-theme.native.ts.
import { Platform } from 'react-native';

import { typography } from '@insolvia-ai/tokens';

import { useThemeOverrides } from './theme';

/**
 * The heading family for the current platform.
 *
 * `web` returns the FULL stack from tokens, so react-native-web resolves it
 * identically to the `.web` leaf's `font-heading`. That is what makes the
 * workbench's two panes comparable at all: any remaining difference in a
 * heading is a real difference, not this indirection.
 *
 * iOS resolves `System` and Android `sans-serif` to that platform's own UI
 * family, which is the same call the `ui-sans-serif, system-ui, sans-serif`
 * stack makes on web — take the platform's sans — rather than a second opinion
 * about typography. Point `fonts.heading` at a serif and both arms move with
 * it; that is the whole reason this indirection is still here.
 *
 * The map is exported separately because `Platform.select` collapses it to one
 * arm at module load, and the arms this platform did NOT take are exactly the
 * ones nothing here can otherwise see. native-typography.native.test.ts asserts
 * against it directly.
 */
/**
 * Size/line-height pairs, matching what the `.web` leaves actually render.
 *
 * The web leaves say `text-sm`/`text-base`/`text-lg`, and Tailwind ships a
 * LINE HEIGHT with each: 12/16, 14/20, 16/24, 18/28 — read off the computed
 * styles in a browser, not off the docs. The native leaves set `fontSize`
 * alone, and react-native-web then falls back to `line-height: normal`, which
 * the browser resolves at roughly 1.2. Every block of native text therefore ran
 * shorter than the same block on web: the Accordion trigger row measured 52px
 * against the web leaf's 57, and the gap compounded with every line.
 *
 * Applied to flowing TEXT only. A `TextInput` is deliberately left alone —
 * setting lineHeight on one is a known Android vertical-centring hazard, and
 * both inputs here have a fixed height that centres the text anyway. So are
 * glyphs pinned inside a fixed box (the Checkbox tick, the Select chevron, the
 * Avatar fallback), where a taller line box would fight the box rather than the
 * text around it.
 */
export const textScale = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
} as const;

export const headingFamilyByPlatform = {
  ios: 'System',
  android: 'sans-serif',
  default: typography.heading,
} as const;

export const headingFamily: string = Platform.select(headingFamilyByPlatform);

/**
 * The mono family for the current platform — the same seam as `heading`, one
 * step down, for `Text`'s `family="mono"`.
 *
 * Same rule and same reason: `web` takes the FULL stack from tokens so
 * react-native-web resolves it identically to the `.web` leaf's `font-mono`,
 * while ios and android each take ONE registered family name, because a
 * comma-separated stack matches nothing in React Native and falls back to the
 * system sans — mono text set in a proportional face, with no error anywhere.
 *
 * iOS ships Menlo; Android has no Menlo and maps the `monospace` generic to
 * Droid Sans Mono. Both are the same call the web stack makes — take the
 * platform's mono — rather than a second opinion, and neither needs a font
 * file shipped from here (see WHY NO FONT FILE IS SHIPPED, above).
 *
 * There is no `bodyFamilyByPlatform`. `body` is the absence of a family: the
 * native leaves have never set one for body copy, so the platform's own sans
 * renders — which is what `--font-body`'s stack asks for too. Adding one would
 * be a visual change to every existing native surface, not part of giving
 * `Text` a family control.
 */
export const monoFamilyByPlatform = {
  ios: 'Menlo',
  android: 'monospace',
  default: typography.mono,
} as const;

export const monoFamily: string = Platform.select(monoFamilyByPlatform);

/**
 * The heading family in scope, honouring any `ThemeProvider` above this
 * component.
 *
 * This is the seam the indirection above exists for. `headingFamily` resolves
 * the PLATFORM's default at module load; a consumer's `fonts.heading` replaces
 * it outright rather than being mapped per platform, because a consumer naming
 * a family has already registered exactly that family in its own app bundle —
 * mapping `'Spectral_600SemiBold'` onto `System` on iOS would discard the one
 * thing they asked for.
 *
 * One registered family name, never a stack. React Native matches a single
 * family and falls back to the system sans for anything else, with no error,
 * so a CSS stack here renders as the default and looks like the override was
 * ignored.
 */
export function useNativeHeadingFamily(): string {
  return useThemeOverrides().fonts?.heading ?? headingFamily;
}

/**
 * The mono family in scope — the same seam as `heading`, for `Text`'s
 * `family="mono"`. Same one-registered-name rule.
 */
export function useNativeMonoFamily(): string {
  return useThemeOverrides().fonts?.mono ?? monoFamily;
}
