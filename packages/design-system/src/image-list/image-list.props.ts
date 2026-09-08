// SHARED — no react-native / react-dom / base-ui import. `react` itself is
// fine (context only, not a renderer).
//
// A grid of images is one design with two totally different LAYOUT ENGINES
// behind it: CSS Grid on web, a wrapping flex row on native (see
// image-list.native.tsx for why there is no FlatList). Neither the column
// count nor the "is this tile allowed to span" question can be answered by
// looking at an `Item` alone — both leaves need to know what `Root` decided —
// so this module holds exactly the two facts a descendant needs and nothing
// about how either platform draws with them, the same split table.props.ts
// makes for striping.
import * as React from 'react';

export type ImageListGap = 'none' | 'xs' | 'sm' | 'md';
export type ImageListVariant = 'standard' | 'quilted';
export type ImageListBarPosition = 'bottom' | 'top';

export const DEFAULT_COLUMNS = 3;

/**
 * `none` maps to Tailwind's built-in `gap-0`, the same "no gap" reading
 * `stack.props.ts` gives it — there is no `--spacing-none` token, `0` already
 * says it in both scales. Native's dp equivalent lives beside
 * `@insolvia-ai/tokens` in the native leaf, not here — see that file's header
 * for why a shared props module never imports tokens.
 */
export const gapClass: Record<ImageListGap, string> = {
  none: 'gap-0',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
};

/**
 * The row height `quilted` fixes `grid-auto-rows` to, in px.
 *
 * A spanned tile (`grid-row: span 2`) needs its rows to have a DEFINITE size
 * for the span to read as a predictable rectangle. Leaving rows to auto-size
 * is circular here: an unspanned 1×1 tile's own height comes from its square
 * aspect, which depends on its column width, which is the thing a row-height
 * would otherwise be measured against. Pinning one number breaks the circle —
 * MUI's `ImageList` makes the same call via its `rowHeight` prop. It is not
 * exposed as a prop here because nothing in this component's spec calls for
 * tuning it per instance; `Item.rows`/`Item.cols` are the caller-facing knob.
 */
export const QUILTED_ROW_PX = 120;

export interface ImageListContextValue {
  /** `Root`'s `columns`, so a descendant never has to be told twice. */
  columns: number;
  /** `Root`'s `variant` — spans are only ever honoured under `quilted`. */
  variant: ImageListVariant;
}

export const ImageListContext = React.createContext<ImageListContextValue | null>(null);

export function useImageListContext(part: string): ImageListContextValue {
  const ctx = React.useContext(ImageListContext);
  if (!ctx) throw new Error(`ImageList.${part} must be rendered inside <ImageList.Root>`);
  return ctx;
}

export interface ImageListItemOwnProps {
  /** Image URL. Both leaves take a plain string. */
  src: string;
  /**
   * Required — it is the image's only accessible name. Pass `''` for a
   * purely decorative tile, which is the explicit way to say "nothing to
   * announce" (see `card.props.ts`'s `CardImageOwnProps.alt` for the same
   * rule stated once already).
   *
   * When this `Item` also renders an `ItemBar`, that bar's `title` is
   * visible text right next to the image — so `alt` must not repeat it
   * verbatim. Describe the image instead (what it shows), or pass `''` if
   * the bar's title/subtitle already say everything worth announcing.
   * Passing the same string to both trips axe's `image-redundant-alt` rule.
   */
  alt: string;
  /**
   * How many grid ROWS this tile spans. Only honoured when `Root`'s
   * `variant` is `'quilted'` — a `standard` grid has no row track worth
   * spanning. Ignored entirely on native; see image-list.native.tsx.
   * Defaults to `1`.
   */
  rows?: number | undefined;
  /**
   * How many grid COLUMNS this tile spans. Only honoured under `quilted`,
   * same as `rows`. Defaults to `1`.
   */
  cols?: number | undefined;
}

export interface ImageListItemBarOwnProps {
  /** The bar's primary line. Required — an ItemBar with nothing to say is a
   * scrim over an image for no reason. */
  title: string;
  /** A de-emphasized second line, rendered under the title. */
  subtitle?: string | undefined;
  /** Which edge of the tile the bar hugs. Defaults to `'bottom'`. */
  position?: ImageListBarPosition | undefined;
}

/**
 * The web leaf's `grid-row`/`grid-column` span, or nothing at all outside
 * `quilted`. A `standard` grid ignores `rows`/`cols` completely rather than
 * emitting `span 1` — indistinguishable in output, but "no span requested"
 * and "requested and it was 1" are different facts, and only one of them is
 * true when the variant does not support spanning at all.
 */
export function spanStyle(
  variant: ImageListVariant,
  rows: number,
  cols: number,
): React.CSSProperties {
  if (variant !== 'quilted') return {};
  const style: React.CSSProperties = {};
  if (rows !== 1) style.gridRow = `span ${rows}`;
  if (cols !== 1) style.gridColumn = `span ${cols}`;
  return style;
}
