// DO NOT EDIT — generated from packages/tokens/tokens.json
// Regenerate with: npm run tokens

/**
 * Design tokens for the React Native app, consumed as `@insolvia-ai/tokens`
 * and used with `StyleSheet.create`.
 *
 * Plain exported consts — no CSS, no Tailwind, no runtime, no dependencies.
 *
 * Colors are the SEMANTIC layer only. The raw palette (ink/brass/paper) is
 * deliberately absent rather than merely discouraged: nothing here exports
 * it, so UI code cannot couple to it by accident and a re-brand stays a
 * one-file change.
 *
 * Derived states are pre-computed with the same sRGB blend that `theme.css`
 * expresses as `color-mix(in srgb, ...)`. The browser defers that blend and
 * React Native cannot, so it is resolved here — both stacks land on the
 * same pixel.
 */

/** A color scheme a consumer can render. Every one is declared in `colors`. */
export type ColorSchemeName = 'light' | 'dark';

/**
 * One complete mapping of colour name onto an sRGB value: the semantic
 * roles, their derived states, and the neutral ramp steps.
 *
 * Every member is required, so a scheme that omits one — a missing
 * dark-mode value — is a compile error, never a silent fallback.
 *
 * The ramp steps sit here, rather than in an export of their own, so that
 * one lookup answers every colour question a leaf has and a consumer
 * overrides a ramp step through exactly the seam it already overrides a
 * role through. They are still a scale rather than roles: prefer `bg` or
 * `line` where one says what you mean, and reach for a step when nothing
 * does.
 */
export interface ColorScheme {
  /** App background "paper". */
  readonly bg: string;

  /** Raised surface behind cards, sheets, and dialogs. */
  readonly card: string;

  /** Inset/alternate surface — table stripes, wells, code blocks. */
  readonly surfaceAlt: string;

  /** Body text on [bg]. */
  readonly ink: string;

  /** The brand ink used by headers and the wordmark. */
  readonly brand: string;

  /** Primary action color (filled CTAs, focus, selection). */
  readonly primary: string;

  /** Text/icon color that sits on top of [primary]. */
  readonly primaryText: string;

  /** Warm brass accent (highlights, focus, key CTAs). */
  readonly accent: string;

  /** De-emphasized text (captions, metadata). */
  readonly muted: string;

  /** Thin divider/border color. */
  readonly line: string;

  /** Success/confirmed state. The dark scheme lifts to a brighter green: the light value scored 3.5:1 on the dark canvas, below the 4.5:1 WCAG AA floor for body text. */
  readonly success: string;

  /** Warning/attention state. */
  readonly warning: string;

  /** Error/destructive state. The dark scheme lifts to a brighter red: the light value scored 2.9:1 on the dark canvas, below the 4.5:1 WCAG AA floor for body text — and Field.Error renders in it. */
  readonly danger: string;

  /** Text/icon color that sits on top of [danger]. Measured against this file's own values: 6.1:1 light (white on #B3352E) and 6.2:1 dark (#071B31 on #E27F79), both clear of the 4.5:1 WCAG AA floor for body text, so a destructive button may carry a LABEL and not only a glyph. The values are [primaryText]'s, which is what IconButton's danger glyph already rode on — this role exists so that stays true by definition rather than by coincidence, and so a brand can move the foreground on its danger fill without dragging its primary fill's along. Note the row this replaces: a hard-coded white fails at 2.8:1 on the dark scheme's lifted red, which is why the foreground has to flip with the scheme. */
  readonly dangerText: string;

  /** Primary text/icon color for controls drawn OVER media — a player transport, a delete affordance on a frame, a filmstrip arrow. 21:1 on [overlayScrim], and 17.4:1 with that scrim at 80% over mid-grey media. Same value in both schemes; see the note above. */
  readonly overlayInk: string;

  /** De-emphasized text/icons over media — a timecode, a duration badge. 9.9:1 on [overlayScrim], 9.0:1 with that scrim at 80% over mid-grey media. Same value in both schemes. */
  readonly overlayMuted: string;

  /** The darkening laid UNDER overlay controls so they are legible on media the app cannot see. Opaque on purpose: a caller applies the alpha it wants at the call site (`bg-overlay-scrim/80`, a gradient stop), because how much scrim a control needs is a property of that control, not of the theme. Same value in both schemes. */
  readonly overlayScrim: string;

  /** Hover fill for a control over media. An ALPHA white rather than a solid, because it composes over a frame this package has never seen — a solid would assume a background and paint a grey box on a bright photograph. Same value in both schemes. */
  readonly overlayHover: string;

  /** Pressed fill for a control over media — one step up from [overlayHover], and alpha for the same reason. Same value in both schemes. */
  readonly overlayActive: string;

  /** Hovered [primary]. */
  readonly primaryHover: string;

  /** Pressed [primary]. */
  readonly primaryActive: string;

  /** Hovered [accent]. */
  readonly accentHover: string;

  /** Hovered [danger]. */
  readonly dangerHover: string;

  /** Neutral 1 — app background. */
  readonly neutral1: string;

  /** Neutral 2 — subtle background. */
  readonly neutral2: string;

  /** Neutral 3 — UI element background. */
  readonly neutral3: string;

  /** Neutral 4 — hovered UI element background. */
  readonly neutral4: string;

  /** Neutral 5 — active/selected UI element background. */
  readonly neutral5: string;

  /** Neutral 6 — subtle border and separator. */
  readonly neutral6: string;

  /** Neutral 7 — UI element border and focus ring. */
  readonly neutral7: string;

  /** Neutral 8 — hovered UI element border. */
  readonly neutral8: string;

  /** Neutral 9 — solid background. */
  readonly neutral9: string;

  /** Neutral 10 — hovered solid background. */
  readonly neutral10: string;

  /** Neutral 11 — low-contrast text. */
  readonly neutral11: string;

  /** Neutral 12 — high-contrast text. */
  readonly neutral12: string;

  /** Neutral alpha 1 — app background, as a transparent overlay. */
  readonly neutralA1: string;

  /** Neutral alpha 2 — subtle background, as a transparent overlay. */
  readonly neutralA2: string;

  /** Neutral alpha 3 — UI element background, as a transparent overlay. */
  readonly neutralA3: string;

  /** Neutral alpha 4 — hovered UI element background, as a transparent overlay. */
  readonly neutralA4: string;

  /** Neutral alpha 5 — active/selected UI element background, as a transparent overlay. */
  readonly neutralA5: string;

  /** Neutral alpha 6 — subtle border and separator, as a transparent overlay. */
  readonly neutralA6: string;

  /** Neutral alpha 7 — UI element border and focus ring, as a transparent overlay. */
  readonly neutralA7: string;

  /** Neutral alpha 8 — hovered UI element border, as a transparent overlay. */
  readonly neutralA8: string;

  /** Neutral alpha 9 — solid background, as a transparent overlay. */
  readonly neutralA9: string;

  /** Neutral alpha 10 — hovered solid background, as a transparent overlay. */
  readonly neutralA10: string;

  /** Neutral alpha 11 — low-contrast text, as a transparent overlay. */
  readonly neutralA11: string;

  /** Neutral alpha 12 — high-contrast text, as a transparent overlay. */
  readonly neutralA12: string;
}

/** Every color name UI code may speak — semantic roles and ramp steps. */
export type SemanticColorName = keyof ColorScheme;

/** Every semantic color, per scheme. */
export const colors = {
  /** The light-mode mapping of palette onto semantics and ramp steps. */
  light: {
    bg: '#FAF9F6',
    card: '#FFFFFF',
    surfaceAlt: '#EFEDE6',
    ink: '#141A1F',
    brand: '#0B2A4A',
    primary: '#0B2A4A',
    primaryText: '#FFFFFF',
    accent: '#B8863B',
    muted: '#5A6672',
    line: '#C9D0D8',
    success: '#2E7D5B',
    warning: '#B8863B',
    danger: '#B3352E',
    dangerText: '#FFFFFF',
    overlayInk: '#FFFFFF',
    overlayMuted: '#FFFFFFB3',
    overlayScrim: '#000000',
    overlayHover: '#FFFFFF33',
    overlayActive: '#FFFFFF4D',
    primaryHover: '#0A2541',
    primaryActive: '#09223B',
    accentHover: '#A27634',
    dangerHover: '#9E2F28',
    neutral1: '#FCFCFC',
    neutral2: '#F9F9F9',
    neutral3: '#F0F0F0',
    neutral4: '#E8E8E8',
    neutral5: '#E0E0E0',
    neutral6: '#D9D9D9',
    neutral7: '#CECECE',
    neutral8: '#BBBBBB',
    neutral9: '#8D8D8D',
    neutral10: '#838383',
    neutral11: '#646464',
    neutral12: '#202020',
    neutralA1: '#00000003',
    neutralA2: '#00000006',
    neutralA3: '#0000000F',
    neutralA4: '#00000017',
    neutralA5: '#0000001F',
    neutralA6: '#00000026',
    neutralA7: '#00000031',
    neutralA8: '#00000044',
    neutralA9: '#00000072',
    neutralA10: '#0000007C',
    neutralA11: '#0000009B',
    neutralA12: '#000000DF',
  },

  /** The dark-mode mapping of palette onto semantics and ramp steps. */
  dark: {
    bg: '#071B31',
    card: '#141A1F',
    surfaceAlt: '#0B2A4A',
    ink: '#FAF9F6',
    brand: '#FFFFFF',
    primary: '#D2A857',
    primaryText: '#071B31',
    accent: '#D2A857',
    muted: '#C9D0D8',
    line: '#FFFFFF33',
    success: '#39B17E',
    warning: '#D2A857',
    danger: '#E27F79',
    dangerText: '#071B31',
    overlayInk: '#FFFFFF',
    overlayMuted: '#FFFFFFB3',
    overlayScrim: '#000000',
    overlayHover: '#FFFFFF33',
    overlayActive: '#FFFFFF4D',
    primaryHover: '#D7B26B',
    primaryActive: '#B08D49',
    accentHover: '#D7B26B',
    dangerHover: '#E58E89',
    neutral1: '#111111',
    neutral2: '#191919',
    neutral3: '#222222',
    neutral4: '#2A2A2A',
    neutral5: '#313131',
    neutral6: '#3A3A3A',
    neutral7: '#484848',
    neutral8: '#606060',
    neutral9: '#6E6E6E',
    neutral10: '#7B7B7B',
    neutral11: '#B4B4B4',
    neutral12: '#EEEEEE',
    neutralA1: '#00000000',
    neutralA2: '#FFFFFF09',
    neutralA3: '#FFFFFF12',
    neutralA4: '#FFFFFF1B',
    neutralA5: '#FFFFFF22',
    neutralA6: '#FFFFFF2C',
    neutralA7: '#FFFFFF3B',
    neutralA8: '#FFFFFF55',
    neutralA9: '#FFFFFF64',
    neutralA10: '#FFFFFF72',
    neutralA11: '#FFFFFFAF',
    neutralA12: '#FFFFFFED',
  },
} as const satisfies Record<ColorSchemeName, ColorScheme>;

/**
 * Exhaustiveness guard: naming a scheme in `ColorSchemeName` without
 * declaring its colors above stops compiling
 * rather than resolving to `undefined` at runtime.
 */
type DeclaredScheme = keyof typeof colors;
type SchemesExhaustive = [Exclude<ColorSchemeName, DeclaredScheme>] extends [never] ? true : never;
const _schemesAreExhaustive: SchemesExhaustive = true;

/**
 * Spacing scale — a 4pt base grid. Use these instead of magic numbers so
 * layout rhythm stays consistent across every surface.
 */
export interface Spacing {
  /** 4 — tightest gutter (icon to label). */
  readonly xs: number;

  /** 8 — inner padding of compact controls. */
  readonly sm: number;

  /** 16 — the default gutter. */
  readonly md: number;

  /** 24 — separation between related blocks. */
  readonly lg: number;

  /** 32 — separation between sections. */
  readonly xl: number;

  /** 48 — page-level breathing room. */
  readonly xxl: number;
}

/** A step on the spacing scale. */
export type SpacingStep = keyof Spacing;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const satisfies Spacing;

/**
 * Corner-radius scale, in density-independent pixels — the unit React
 * Native's `borderRadius` already speaks.
 */
export interface Radii {
  /** 0 — square corners, named so a component can ask for "no radius" in the same vocabulary as every other step. */
  readonly none: number;

  /** 2 — the faintest softening; checkbox ticks, tags, dense table cells. */
  readonly xs: number;

  /** 6 — chips, inputs, small controls. */
  readonly sm: number;

  /** 10 — buttons and the default control radius. */
  readonly md: number;

  /** 16 — cards and raised surfaces. */
  readonly lg: number;

  /** 999 — fully rounded (pills, avatars). */
  readonly pill: number;
}

/** A step on the corner-radius scale. */
export type RadiusName = keyof Radii;

export const radii = {
  none: 0,
  xs: 2,
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const satisfies Radii;

/**
 * Type families, as authored: the same CSS family stacks the web surfaces
 * use. React Native resolves a single registered family rather than a
 * stack, so a native leaf must NOT pass `heading` through verbatim — it
 * maps the role onto each platform's own serif instead. See
 * design-system/src/lib/native-typography.native.ts, which owns that
 * mapping and the reason no font file ships with either package.
 *
 * `mono` needs the same treatment for the same reason — iOS ships Menlo,
 * and Android maps the `monospace` generic — so a native leaf takes the
 * platform's monospace rather than this stack verbatim.
 *
 * `body` needs no such mapping: this stack already resolves to the
 * platform UI family on every target.
 */
export interface Typography {
  /** Display/heading family — apps may override to brand themselves. */
  readonly heading: string;

  /** Body/UI family — apps may override to brand themselves. */
  readonly body: string;

  /** Monospace family — code, IDs, keyboard shortcuts, anything that must align by column. */
  readonly mono: string;
}

/** A type role. */
export type FontRole = keyof Typography;

export const typography = {
  heading: 'ui-serif, Georgia, Cambria, serif',
  body: 'ui-sans-serif, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const satisfies Typography;

/**
 * Motion primitives, so a duration or a curve is a token rather than a
 * number typed into a component and never matched anywhere else.
 *
 * Durations are plain milliseconds — the unit `Animated.timing`, `withTiming`
 * and CSS all take — given to each stack in the form it wants: a number
 * here, `120ms` in `theme.css`.
 *
 * The easing is authored in the CSS `cubic-bezier()` form, which is what the
 * web side needs literally. A native consumer reads the same four control
 * points out of it — `Easing.bezier(0.2, 0, 0, 1)` — so both stacks describe
 * one curve rather than two that happen to look similar.
 */
export interface Motion {
  /** 120ms — state flips the eye should not have to wait for: hover, focus ring, checkbox tick. */
  readonly durationFast: number;

  /** 200ms — the default transition: things that move, open, or fade. */
  readonly durationBase: number;

  /** The one standard curve — quick to leave, slow to settle. Authored in the CSS form; a native consumer feeds the same four control points to Easing.bezier. */
  readonly easingStandard: string;
}

/** A motion primitive — a duration or an easing curve. */
export type MotionToken = keyof Motion;

export const motion = {
  durationFast: 120,
  durationBase: 200,
  easingStandard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const satisfies Motion;
