// Direct unit tests for the shared page-range algorithm, separate from the
// DOM tests: this is the part BOTH leaves execute, so its output is pinned
// once here instead of once per platform. Same pattern as
// collapsible.props.test.ts.
import { describe, expect, it } from 'vitest';

import { paginationItems, type PaginationItem } from './pagination.props';

/** Collapse an item list to something easy to read in a failure diff. */
function pages(items: PaginationItem[]): (number | 'start' | 'end')[] {
  return items.map((item) => (item.type === 'page' ? item.page : item.key));
}

describe('paginationItems', () => {
  it('count 10, page 1: the sibling window already touches the boundary, so only one ellipsis appears', () => {
    expect(pages(paginationItems(10, 1, 1, 1))).toEqual([1, 2, 3, 4, 5, 'end', 10]);
  });

  it('count 10, page 5: an ellipsis on both sides of the sibling window', () => {
    expect(pages(paginationItems(10, 5, 1, 1))).toEqual([1, 'start', 4, 5, 6, 'end', 10]);
  });

  it('count 10, page 10: the mirror image of page 1', () => {
    expect(pages(paginationItems(10, 10, 1, 1))).toEqual([1, 'start', 6, 7, 8, 9, 10]);
  });

  it('count 3: every page fits with no ellipsis at all, whatever page is current', () => {
    expect(pages(paginationItems(3, 1, 1, 1))).toEqual([1, 2, 3]);
    expect(pages(paginationItems(3, 2, 1, 1))).toEqual([1, 2, 3]);
    expect(pages(paginationItems(3, 3, 1, 1))).toEqual([1, 2, 3]);
  });

  it('count 1: a single page and nothing else', () => {
    expect(pages(paginationItems(1, 1, 1, 1))).toEqual([1]);
  });

  it('siblingCount 2: a wider window before either ellipsis is needed', () => {
    expect(pages(paginationItems(10, 5, 2, 1))).toEqual([1, 2, 3, 4, 5, 6, 7, 'end', 10]);
  });

  it('boundaryCount 2: two pages held at each end', () => {
    expect(pages(paginationItems(10, 5, 1, 2))).toEqual([1, 2, 3, 4, 5, 6, 'end', 9, 10]);
  });

  it('collapses a would-be one-page ellipsis into the page number instead', () => {
    // Between the sibling window (4-6) and the last boundary page (8) sits
    // exactly one hidden page — 7 — so it renders rather than being replaced
    // by an ellipsis that would not have saved any space.
    expect(pages(paginationItems(8, 6, 1, 1))).toEqual([1, 'start', 4, 5, 6, 7, 8]);
  });

  it('is independent of siblingCount/boundaryCount growing past what count can hold', () => {
    // boundaryCount 2 on a 3-page trail still shows exactly the 3 pages —
    // the boundaries overlap the whole trail rather than doubling up on it.
    expect(pages(paginationItems(3, 2, 1, 2))).toEqual([1, 2, 3]);
  });
});
