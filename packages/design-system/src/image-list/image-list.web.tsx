// WEB LEAF — plain React DOM + Tailwind, laid out with CSS Grid.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  DEFAULT_COLUMNS,
  gapClass,
  ImageListContext,
  QUILTED_ROW_PX,
  spanStyle,
  useImageListContext,
  type ImageListGap,
  type ImageListItemBarOwnProps,
  type ImageListItemOwnProps,
  type ImageListVariant,
} from './image-list.props';

export interface ImageListRootProps extends React.ComponentPropsWithoutRef<'ul'> {
  /** Number of grid columns. Defaults to `3`. */
  columns?: number | undefined;
  /** Gap between tiles. Defaults to `'sm'`. */
  gap?: ImageListGap | undefined;
  /** `'quilted'` lets `Item.rows`/`Item.cols` span more than one track. Defaults to `'standard'`. */
  variant?: ImageListVariant | undefined;
}

/**
 * `<ul role="list">`, not a bare `<div>` grid: a list of images is a list,
 * and Safari/VoiceOver drop the implicit `list`/`listitem` roles the moment
 * `list-style: none` is set (which `list-none` does), so the role is put
 * back by hand rather than relying on the element alone.
 *
 * Block-level, like every other layout primitive here — it stretches to its
 * parent's width and declares nothing, so there is no `inline-*`/`alignSelf`
 * seam to keep in sync with the native leaf.
 */
const ImageListRoot = React.forwardRef<HTMLUListElement, ImageListRootProps>(
  (
    {
      className,
      columns = DEFAULT_COLUMNS,
      gap = 'sm',
      variant = 'standard',
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = React.useMemo(() => ({ columns, variant }), [columns, variant]);
    return (
      <ImageListContext.Provider value={ctx}>
        <ul
          ref={ref}
          role="list"
          className={cn('grid list-none p-0', gapClass[gap], className)}
          style={{
            // `columns` is a caller-chosen number, not one of a fixed set
            // Tailwind can generate class names for ahead of time — a
            // dynamic column count has to be an inline style, the same
            // reason `Card.Image`'s `height` is one.
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            // Fixed only under `quilted`, so `grid-row: span n` has a
            // definite track to multiply — see `QUILTED_ROW_PX`'s doc
            // comment for why this can't be left to auto-sizing.
            ...(variant === 'quilted' ? { gridAutoRows: `${QUILTED_ROW_PX}px` } : null),
            ...style,
          }}
          {...props}
        >
          {children}
        </ul>
      </ImageListContext.Provider>
    );
  },
);
ImageListRoot.displayName = 'ImageList.Root';

export interface ImageListItemProps
  extends Omit<React.ComponentPropsWithoutRef<'li'>, 'children'>, ImageListItemOwnProps {
  /** An `ImageList.ItemBar`, typically. */
  children?: React.ReactNode;
}

/**
 * One tile: a square, cropped image with `ItemBar` free to lay an overlay
 * caption over it. `relative overflow-hidden` is what makes that possible —
 * `ItemBar` positions itself `absolute` against THIS element, and the same
 * `overflow-hidden` clips both the image and the bar to the tile's rounded
 * corners.
 *
 * Under `quilted`, the tile's box comes from the grid area it spans instead
 * (`spanStyle`), and `aspect-square` must NOT be on it — measured in the
 * workbench, where a 2×2 tile painted taller than its two 120px rows and the
 * tile placed in the row below drew over its bottom edge. The first draft
 * assumed the grid area would win over the aspect ratio; CSS says the
 * opposite for a grid item — an `aspect-ratio` turns the default `normal`
 * self-alignment into `start`, so the tile takes its ratio-derived height
 * and overflows the tracks. Dropping the ratio lets the default stretch fill
 * exactly the rows it spans, and `object-cover` still crops the image to it.
 */
const ImageListItem = React.forwardRef<HTMLLIElement, ImageListItemProps>(
  ({ className, src, alt, rows = 1, cols = 1, style, children, ...props }, ref) => {
    const { variant } = useImageListContext('Item');
    return (
      <li
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-md',
          variant === 'quilted' ? 'min-h-0' : 'aspect-square',
          className,
        )}
        style={{ ...spanStyle(variant, rows, cols), ...style }}
        {...props}
      >
        <img src={src} alt={alt} className="size-full object-cover" />
        {children}
      </li>
    );
  },
);
ImageListItem.displayName = 'ImageList.Item';

export interface ImageListItemBarProps
  // `title` collides with the DOM's own tooltip attribute (optional
  // `string | undefined` there, required `string` here) — the same shape
  // Card.Image's props interface omits `alt`/`src`/`height` for.
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'>, ImageListItemBarOwnProps {
  /** Rendered at the bar's trailing end — an icon button, typically. */
  actions?: React.ReactNode;
}

/**
 * The overlay caption. `overlay-scrim`/`overlay-ink`/`overlay-muted` are the
 * one set of tokens this package keeps identical in BOTH colour schemes —
 * `tokens.json` explains why (chrome over a photograph does not follow the
 * app's own scheme) — which is what keeps this bar legible over an arbitrary
 * image regardless of whether the page around it is light or dark.
 */
const ImageListItemBar = React.forwardRef<HTMLDivElement, ImageListItemBarProps>(
  ({ className, title, subtitle, actions, position = 'bottom', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute inset-x-0 flex items-center gap-sm bg-overlay-scrim p-sm text-overlay-ink',
        position === 'bottom' ? 'bottom-0' : 'top-0',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium text-overlay-ink">{title}</p>
        {subtitle === undefined ? null : (
          <p className="truncate font-body text-xs text-overlay-muted">{subtitle}</p>
        )}
      </div>
      {actions === undefined ? null : (
        <div className="flex shrink-0 items-center gap-xs">{actions}</div>
      )}
    </div>
  ),
);
ImageListItemBar.displayName = 'ImageList.ItemBar';

export const ImageList = {
  Root: ImageListRoot,
  Item: ImageListItem,
  ItemBar: ImageListItemBar,
};
