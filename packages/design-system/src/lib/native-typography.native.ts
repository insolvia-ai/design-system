// NATIVE LEAF (src/lib) — the heading family, resolved per platform.
//
// WHY THIS FILE EXISTS. The web leaves say `font-heading`, which resolves to
// the stack in theme.css: `ui-serif, Georgia, Cambria, serif`. React Native
// cannot take a stack — it resolves exactly ONE registered family name — so the
// native leaves set no `fontFamily` at all and rendered the platform UI sans
// while every web surface rendered a serif. Both leaves claimed to implement
// one design and disagreed about its most visible property.
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

/**
 * The heading family for the current platform.
 *
 * `web` returns the FULL stack from tokens, so react-native-web resolves it
 * identically to the `.web` leaf's `font-heading`. That is what makes the
 * workbench's two panes comparable at all: any remaining difference in a
 * heading is a real difference, not this indirection.
 *
 * iOS ships Georgia; Android has no Georgia and maps the `serif` generic to
 * Noto Serif. Both are the same call the web stack makes — take the platform's
 * serif — rather than a second opinion about typography.
 *
 * The map is exported separately because `Platform.select` collapses it to one
 * arm at module load, and the arms this platform did NOT take are exactly the
 * ones nothing here can otherwise see. native-typography.native.test.ts asserts
 * against it directly.
 */
export const headingFamilyByPlatform = {
  ios: 'Georgia',
  android: 'serif',
  default: typography.heading,
} as const;

export const headingFamily: string = Platform.select(headingFamilyByPlatform);
