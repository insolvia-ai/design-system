// SHARED — no react-native / react-dom / base-ui import. The page-range
// algorithm is the reusable substance of a pagination control: which numbers
// show, where the ellipses go, and when a hidden gap of exactly one page
// collapses into that page number instead. Everything else — `<nav><ul>`
// against a row of Views, `onClick` against `onPress` — diverges, so it stays
// in the leaves.
//
// `paginationItems` is PORTED FROM MATERIAL UI'S `usePagination`, faithfully,
// not reinvented. The boundary/sibling/ellipsis-collapse behaviour has been
// tuned against years of real usage, and rewriting it from a description
// would just rediscover its edge cases one bug report at a time. What differs
// is scope: this returns only the numbered/ellipsis MIDDLE of the trail.
// Previous/Next/First/Last never move, so each leaf renders that fixed set of
// buttons itself rather than asking this function to describe them too.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export type PaginationSize = 'sm' | 'md';

export type PaginationItem =
  { type: 'page'; page: number } | { type: 'ellipsis'; key: 'start' | 'end' };

/**
 * `Array.from`-safe inclusive range. A negative length (an empty or
 * backwards span) becomes `[]` rather than a thrown `RangeError` — the
 * algorithm below relies on that at small `count`, where MUI's original
 * leans on `Array.from({ length: negative })` silently clamping to 0.
 */
function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return length <= 0 ? [] : Array.from({ length }, (_, index) => start + index);
}

/**
 * The visible page numbers and ellipses for one page of a `count`-page trail.
 *
 * `boundaryCount` pages always show at each end; `siblingCount` pages show on
 * each side of `page`. The gap between a boundary and the sibling window
 * collapses to one `{ type: 'ellipsis' }` — UNLESS that gap is exactly one
 * page, in which case the page number renders instead. An ellipsis standing
 * in for a single hidden page saves no space and costs a keyboard user a tab
 * stop for nothing, so it never appears in that shape.
 */
export function paginationItems(
  count: number,
  page: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0]! - 2 : count - 1,
  );

  const numbers: (number | 'start-ellipsis' | 'end-ellipsis')[] = [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? (['start-ellipsis'] as const)
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1
      ? (['end-ellipsis'] as const)
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];

  return numbers.map((item) =>
    item === 'start-ellipsis'
      ? { type: 'ellipsis', key: 'start' }
      : item === 'end-ellipsis'
        ? { type: 'ellipsis', key: 'end' }
        : { type: 'page', page: item },
  );
}

export const PREV_LABEL = 'Previous page';
export const NEXT_LABEL = 'Next page';
export const FIRST_LABEL = 'First page';
export const LAST_LABEL = 'Last page';

/**
 * `aria-label`/`accessibilityLabel` for a page button.
 *
 * The number renders exactly as given — plain JS numbers, no
 * `Intl.NumberFormat` anywhere in this module. Grouping a four-digit page
 * count with commas (or not) is a locale decision a consumer's own
 * formatting layer makes; baking one in here would pick a locale for every
 * consumer that never asked for it, and get digit grouping outright wrong for
 * the ones whose locale does not use commas.
 */
export function pageLabel(page: number, current: boolean): string {
  return current ? `Page ${page}` : `Go to page ${page}`;
}

/** Item edge length in px, shared by both leaves — 32/40. */
export const sizeBox: Record<PaginationSize, number> = { sm: 32, md: 40 };

/** Web item classes: size plus the two states shared by every item. */
export const sizeItemClass: Record<PaginationSize, string> = {
  sm: 'size-8 text-sm',
  md: 'size-10 text-sm',
};

/**
 * WCAG 2.5.5's 44×44 hit area, at `sm` only — the same asymmetry
 * `icon-button.native.tsx`'s `sizeHitSlop` uses: `sm`'s 32px box sits below
 * the floor and gets padded; `md`'s 40px is already close enough that a
 * second pad would just be noise between adjacent items.
 */
export const sizeHitSlop: Record<PaginationSize, number> = { sm: 6, md: 0 };

export interface PaginationOwnProps {
  /** Total number of pages. At least 1. */
  count: number;
  /** Controlled current page (1-based). Pair with `onPageChange`. */
  page?: number | undefined;
  /** Uncontrolled starting page. Defaults to 1. */
  defaultPage?: number | undefined;
  onPageChange?: ((next: number) => void) | undefined;
  /** Pages shown on each side of the current page. */
  siblingCount?: number | undefined;
  /** Pages always shown at each end of the trail. */
  boundaryCount?: number | undefined;
  /**
   * Adds « and » buttons that jump straight to the first/last page.
   * ‹ › (previous/next) are always shown regardless of this flag.
   */
  showFirstLast?: boolean | undefined;
  size?: PaginationSize | undefined;
  disabled?: boolean | undefined;
  /** The nav landmark's accessible name. */
  label?: string | undefined;
}

export interface PaginationState {
  page: number;
  setPage: (next: number) => void;
  items: PaginationItem[];
}

/**
 * The controlled/uncontrolled current page, plus the item list computed for
 * it. Both leaves call this and render `items` — the algorithm runs once per
 * render, not once per platform, so the two leaves cannot disagree about
 * which pages are visible.
 */
export function usePaginationState({
  count,
  page,
  defaultPage = 1,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
}: Pick<
  PaginationOwnProps,
  'count' | 'page' | 'defaultPage' | 'onPageChange' | 'siblingCount' | 'boundaryCount'
>): PaginationState {
  const [current, setCurrent] = useControllableState<number>(page, defaultPage, onPageChange);
  const items = React.useMemo(
    () => paginationItems(count, current, siblingCount, boundaryCount),
    [count, current, siblingCount, boundaryCount],
  );
  return { page: current, setPage: setCurrent, items };
}
