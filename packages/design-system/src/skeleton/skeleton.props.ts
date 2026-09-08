// SHARED — no react-native / react-dom / base-ui import. Pure data: variant
// shape, sizing defaults, and the paragraph line-width math both leaves
// render off of. Skeleton carries no state and no accessibility wiring of
// its own, so nothing here forces a leaf pair — the leaves differ only in
// which primitives they draw a filled box with.
//
// SKELETON IS SILENT ON PURPOSE. It renders `aria-hidden`/`accessible={false}`
// on both leaves (see skeleton.web.tsx / skeleton.native.tsx), because a box
// with no content has nothing worth announcing and a screen reader that stops
// on five of them while a page loads is worse than one that skips them all.
// The LOADING STATE itself is the caller's to announce: the container a
// consumer wraps real, still-loading content in should carry `aria-busy`
// (`accessibilityState={{ busy: true }}` on native) — that is on the region
// that will actually receive content, which Skeleton is not.
export type SkeletonVariant = 'text' | 'circle' | 'rect';
export type SkeletonAnimation = 'pulse' | 'none';

/**
 * A size a caller passes, or a leaf resolves internally.
 *
 * The native leaf's own prop type is narrower in practice — a number (native
 * px) or a percentage string (`'50%'`) only, because React Native's style
 * engine has no `calc()` and cannot parse an arbitrary CSS length. The web
 * leaf accepts this wider type because it hands the value straight to a DOM
 * `style`, which can.
 */
export type SkeletonDimension = number | string;

/**
 * One line of `text-sm` (14px/20px) — see `native-typography.native.ts`'s
 * `textScale.sm.lineHeight`. Duplicated as a literal rather than imported:
 * no `*.props.ts` in this package imports `@insolvia-ai/tokens` (see
 * `stack.props.ts` for the rule and why — that import belongs beside the
 * native leaf that needs it), and `textScale` lives one layer further out
 * than that, in a native-only leaf module. A skeleton line draws only the
 * LINE HEIGHT, never a `fontSize` — there is no glyph to size.
 */
export const TEXT_LINE_HEIGHT = 20;

/**
 * The default circle diameter. Avatar's own sizes run 24/32/40
 * (`avatarSizePx`); this sits at the top of that range so an avatar-shaped
 * placeholder reads generously rather than needing a caller to size it for
 * every avatar it stands in for.
 */
export const DEFAULT_CIRCLE_SIZE = 40;

/** The default rect height — tall enough to read as a media/thumbnail block
 * rather than a stray bar. */
export const DEFAULT_RECT_HEIGHT = 120;

/**
 * How much narrower a paragraph's last line renders, so a multi-line text
 * skeleton reads as a paragraph (a ragged right edge) rather than a stack of
 * identical bars. Matches Material UI's own Skeleton, this component's
 * behavioural reference.
 */
export const LAST_LINE_SCALE = 0.6;

const defaultWidth: Record<SkeletonVariant, SkeletonDimension> = {
  text: '100%',
  circle: DEFAULT_CIRCLE_SIZE,
  rect: '100%',
};

const defaultHeight: Record<SkeletonVariant, SkeletonDimension> = {
  text: TEXT_LINE_HEIGHT,
  circle: DEFAULT_CIRCLE_SIZE,
  rect: DEFAULT_RECT_HEIGHT,
};

/**
 * The corner radius per variant, in the web leaf's own vocabulary. The
 * native leaf reads the matching step off `useNativeRadii()` instead
 * (`.sm`/`.md`), because radii need to follow a `ThemeProvider` at render
 * time — except `circle`, which reads `radii.pill` from the tokens package
 * directly on both leaves: a pill is a shape, not a themeable corner, the
 * same distinction `native-theme.native.ts` documents for Badge and Avatar.
 */
export const variantRadiusClass: Record<SkeletonVariant, string> = {
  text: 'rounded-sm',
  circle: 'rounded-pill',
  rect: 'rounded-md',
};

export interface SkeletonOwnProps {
  /** The shape being placeholder-ed. Defaults to `'text'`. */
  variant?: SkeletonVariant | undefined;
  /**
   * Explicit width. A number is native px / a web `px`; a string is passed
   * through — a CSS length on web, a percentage on native (see
   * `SkeletonDimension`). Defaults per `variant`: `'100%'` for `text` and
   * `rect`, `40` for `circle`.
   */
  width?: SkeletonDimension | undefined;
  /**
   * Explicit height. Ignored on `circle`, which always mirrors the resolved
   * `width` instead — a circle stays a circle regardless of what a caller
   * passes here. Defaults per `variant`: one line of `text-sm` (`20`) for
   * `text`, `120` for `rect`.
   */
  height?: SkeletonDimension | undefined;
  /**
   * `text` only: how many stacked lines to render. Defaults to `1`. Once
   * greater than 1, the LAST line renders at `LAST_LINE_SCALE` (60%) of
   * `width`, so a paragraph placeholder has the ragged right edge a real
   * paragraph has instead of reading as a table of identical bars.
   */
  lines?: number | undefined;
  /**
   * Defaults to `'pulse'`. `'none'` suits a caller that already wraps the
   * whole loading region in its own animated container and does not want a
   * second animation layered underneath.
   */
  animation?: SkeletonAnimation | undefined;
}

/** Resolves `width` against the variant's default. */
export function resolveWidth(
  variant: SkeletonVariant,
  width: SkeletonDimension | undefined,
): SkeletonDimension {
  return width ?? defaultWidth[variant];
}

/**
 * Resolves `height` against the variant's default. `circle` never reads
 * `height` at all — it mirrors the resolved `width` instead, which is what
 * keeps a circle a circle no matter what a caller passes for `height`. That
 * is quieter than warning on an ignored prop, which would fire on every
 * default render.
 */
export function resolveHeight(
  variant: SkeletonVariant,
  width: SkeletonDimension | undefined,
  height: SkeletonDimension | undefined,
): SkeletonDimension {
  if (variant === 'circle') return resolveWidth(variant, width);
  return height ?? defaultHeight[variant];
}

/**
 * How many lines to render. Only `text` ever renders more than one — every
 * other variant is always a single box. Floors and clamps a caller's `lines`
 * so a `0` or a fractional value cannot render zero boxes or a fractional
 * one.
 */
export function resolveLineCount(variant: SkeletonVariant, lines: number | undefined): number {
  if (variant !== 'text') return 1;
  return Math.max(1, Math.floor(lines ?? 1));
}

/**
 * Scales a width down for a paragraph's last line (see `LAST_LINE_SCALE`).
 *
 * A number scales directly. A percentage string scales its OWN percentage,
 * so the default `'100%'` becomes `'60%'` and a caller's own `'80%'` becomes
 * `'48%'` — proportional to what they asked for, not to some outer box this
 * function cannot see. Any other CSS length (`'20rem'`, a `calc()` a caller
 * already wrote) is itself wrapped in `calc()`; that branch is web-only in
 * practice, because the native leaf's own width prop is restricted to a
 * number or a percentage in the first place (see `SkeletonDimension`).
 */
export function scaleLastLine(width: SkeletonDimension): SkeletonDimension {
  if (typeof width === 'number') return Math.round(width * LAST_LINE_SCALE);
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(width.trim());
  const digits = percent?.[1];
  if (digits !== undefined) {
    const scaled = Number((parseFloat(digits) * LAST_LINE_SCALE).toFixed(2));
    return `${scaled}%`;
  }
  return `calc(${width} * ${LAST_LINE_SCALE})`;
}

/**
 * The width for one line at `index` of `lines` stacked text lines — every
 * line but the last renders at the resolved width; the last renders scaled
 * down, once there is more than one line to make ragged at all.
 */
export function textLineWidth(
  width: SkeletonDimension,
  index: number,
  lines: number,
): SkeletonDimension {
  const isLast = lines > 1 && index === lines - 1;
  return isLast ? scaleLastLine(width) : width;
}
