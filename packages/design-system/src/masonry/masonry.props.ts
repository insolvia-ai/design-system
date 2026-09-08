// SHARED — no react-native / react-dom / base-ui import. `react` itself is
// fine (see the package rule): `React.Children.toArray` is pure React, not a
// renderer.
//
// THE HONEST CONSTRAINT: a true masonry grid packs each item into whichever
// column is currently shortest, and that needs a MEASURED height — the height
// a browser or a device only knows after it has laid the item out. Neither
// leaf in this package measures anything at render time (there is no
// `onLayout` round-trip here, and the web leaf renders in one pass with no
// ref-measuring effect), so "shortest column" is off the table and every
// masonry-shaped thing this component can do is a fixed, height-blind
// distribution decided from `columns` and the item's INDEX alone.
//
// REJECTED: CSS multi-column (`columns`/`column-count`) on web, with each
// child a `column-span: none` block. It is the free, no-JS way to get a
// masonry look on web, and it was rejected precisely because it is
// web-only: `column-count` has no React Native equivalent, so the native leaf
// would still need its own distribution, and CSS multi-column fills
// COLUMN-major (item 2 sits under item 1, in the first column) while the
// obvious native port — N `View`s in a row, pushing items round-robin — fills
// ROW-major (item 2 sits beside item 1, in the second column). The two panes
// would each look correct alone and disagree about where every item after the
// first landed, which is exactly the failure this package's whole design
// exists to catch (see `workbench/leaf-pair.tsx`).
//
// So there is no CSS-columns leaf. Both leaves render `columns` explicit
// column containers (web `div`s, native `View`s) and fill them from THIS
// function — same input, same output, on both platforms, by construction
// rather than by two implementations happening to agree.
import * as React from 'react';

/** Gap token between columns, and between items within a column. */
export type MasonryGap = 'none' | 'xs' | 'sm' | 'md' | 'lg';

/** `none` maps to Tailwind's built-in `gap-0` — there is no `--spacing-none`
 * token, `0` already says "no gap" in both scales. */
export const gapClass: Record<MasonryGap, string> = {
  none: 'gap-0',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
};

/**
 * Split `children` into `columns` buckets, in one of two fixed orders:
 *
 * - `sequential=false` (default): ROUND-ROBIN, row-major. Item `i` goes to
 *   column `i % columns` — reading order across the row of columns, the same
 *   order a `<table>` or a CSS grid with `grid-auto-flow: row` would put them
 *   in. This is the default because it is the order that survives a screen
 *   reader or a keyboard tab straight through the DOM without the visual
 *   column layout mattering.
 * - `sequential=true`: COLUMN-major. Column 0 gets the first
 *   `ceil(n / columns)` items, column 1 the next block, and so on — each
 *   column read top-to-bottom before the next column starts. This is the
 *   order CSS multi-column gives for free (which is why it is the one to
 *   reach for when a consumer wants that specific look) and the one a
 *   Pinterest-style feed usually means by "masonry order".
 *
 * `columns` is clamped to a minimum of 1 so a caller passing `0` or a
 * negative number gets one full column back instead of an empty result or a
 * division by zero. `children` goes through `React.Children.toArray` first,
 * which drops `null`/`undefined`/`boolean` entries and assigns stable keys —
 * so a conditionally-rendered child never reserves a column slot it does not
 * fill, on either leaf.
 */
export function distribute(
  children: React.ReactNode,
  columns: number,
  sequential = false,
): React.ReactNode[][] {
  const items = React.Children.toArray(children);
  const n = Math.max(1, Math.floor(columns));
  const result: React.ReactNode[][] = Array.from({ length: n }, () => []);

  if (sequential) {
    const perColumn = Math.ceil(items.length / n);
    items.forEach((item, i) => {
      const column = perColumn === 0 ? 0 : Math.min(n - 1, Math.floor(i / perColumn));
      result[column]!.push(item);
    });
  } else {
    items.forEach((item, i) => {
      result[i % n]!.push(item);
    });
  }

  return result;
}
