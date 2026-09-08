// Direct unit tests for the pure logic both leaves share: sorting, paging,
// and the header checkbox's derived state. The leaf tests pin the DOM/native
// wiring around these; this file pins the algorithms themselves once.
import { describe, expect, it } from 'vitest';

import {
  formatPageRange,
  nextSort,
  pageCount,
  paginate,
  selectAllState,
  sortAccessibilityLabel,
  sortRows,
  toggleAllOnPage,
  toggleRow,
  type DataGridColumn,
} from './data-grid.props';

interface Row {
  id: string;
  name: string;
  score: number | null;
}

const columns: DataGridColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'score', header: 'Score', sortable: true, align: 'end' },
];

const rows: Row[] = [
  { id: 'b', name: 'Bea', score: 10 },
  { id: 'a', name: 'Ada', score: 30 },
  { id: 'c', name: 'Cy', score: null },
  { id: 'd', name: 'Deb', score: 20 },
];

describe('sortRows', () => {
  it('returns a fresh, unsorted copy when sort is null', () => {
    const result = sortRows(rows, null, columns);
    expect(result).toEqual(rows);
    expect(result).not.toBe(rows);
  });

  it('sorts numbers ascending, with null last', () => {
    const result = sortRows(rows, { key: 'score', direction: 'asc' }, columns);
    expect(result.map((r) => r.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('sorts numbers descending, with null STILL last', () => {
    const result = sortRows(rows, { key: 'score', direction: 'desc' }, columns);
    expect(result.map((r) => r.id)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('sorts strings ascending via localeCompare', () => {
    const result = sortRows(rows, { key: 'name', direction: 'asc' }, columns);
    expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is stable: equal values keep their original relative order', () => {
    const tied: Row[] = [
      { id: '1', name: 'x', score: 5 },
      { id: '2', name: 'x', score: 5 },
      { id: '3', name: 'x', score: 5 },
    ];
    const result = sortRows(tied, { key: 'score', direction: 'asc' }, columns);
    expect(result.map((r) => r.id)).toEqual(['1', '2', '3']);
  });

  it('a sort key naming no column returns rows unsorted rather than throwing', () => {
    const result = sortRows(rows, { key: 'nope', direction: 'asc' }, columns);
    expect(result.map((r) => r.id)).toEqual(rows.map((r) => r.id));
  });

  it('does not mutate the input array', () => {
    const copy = [...rows];
    sortRows(rows, { key: 'score', direction: 'asc' }, columns);
    expect(rows).toEqual(copy);
  });
});

describe('paginate', () => {
  const ten = Array.from({ length: 10 }, (_, i) => i + 1);

  it('slices a 1-based page of the given size', () => {
    expect(paginate(ten, 1, 4)).toEqual([1, 2, 3, 4]);
    expect(paginate(ten, 2, 4)).toEqual([5, 6, 7, 8]);
    expect(paginate(ten, 3, 4)).toEqual([9, 10]);
  });

  it('an out-of-range page returns an empty slice', () => {
    expect(paginate(ten, 5, 4)).toEqual([]);
  });

  it('pageSize <= 0 returns every row, unpaginated', () => {
    expect(paginate(ten, 1, 0)).toEqual(ten);
    expect(paginate(ten, 3, -1)).toEqual(ten);
  });
});

describe('pageCount', () => {
  it('rounds up', () => {
    expect(pageCount(10, 4)).toBe(3);
    expect(pageCount(8, 4)).toBe(2);
  });

  it('is at least 1, even for zero rows', () => {
    expect(pageCount(0, 4)).toBe(1);
  });

  it('is 1 when pagination is off', () => {
    expect(pageCount(42, 0)).toBe(1);
  });
});

describe('formatPageRange', () => {
  it('renders an en dash between the range and "of <total>"', () => {
    expect(formatPageRange(1, 10, 42)).toBe('1–10 of 42');
  });

  it('renders 0–0 of 0 for an empty set', () => {
    expect(formatPageRange(0, 0, 0)).toBe('0–0 of 0');
  });
});

describe('nextSort', () => {
  it('unsorted → asc on the clicked column', () => {
    expect(nextSort(null, 'score')).toEqual({ key: 'score', direction: 'asc' });
  });

  it('asc → desc on the same column', () => {
    expect(nextSort({ key: 'score', direction: 'asc' }, 'score')).toEqual({
      key: 'score',
      direction: 'desc',
    });
  });

  it('desc → none on the same column', () => {
    expect(nextSort({ key: 'score', direction: 'desc' }, 'score')).toBeNull();
  });

  it('clicking a DIFFERENT column starts fresh at asc', () => {
    expect(nextSort({ key: 'score', direction: 'desc' }, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
  });
});

describe('toggleRow', () => {
  it('adds an id when checked', () => {
    expect(toggleRow(['a'], 'b', true)).toEqual(['a', 'b']);
  });

  it('does not duplicate an already-selected id', () => {
    expect(toggleRow(['a', 'b'], 'b', true)).toEqual(['a', 'b']);
  });

  it('removes an id when unchecked', () => {
    expect(toggleRow(['a', 'b'], 'a', false)).toEqual(['b']);
  });
});

describe('toggleAllOnPage', () => {
  it('adds every page id, leaving other selections untouched', () => {
    expect(toggleAllOnPage(['x'], ['a', 'b'], true)).toEqual(['x', 'a', 'b']);
  });

  it('removes only the page ids, keeping selections from other pages', () => {
    expect(toggleAllOnPage(['x', 'a', 'b'], ['a', 'b'], false)).toEqual(['x']);
  });
});

describe('selectAllState', () => {
  it('none selected on the page', () => {
    expect(selectAllState(['a', 'b'], [])).toBe('none');
  });

  it('every row on the page selected', () => {
    expect(selectAllState(['a', 'b'], ['a', 'b'])).toBe('all');
  });

  it('some, but not all, of the page selected', () => {
    expect(selectAllState(['a', 'b'], ['a'])).toBe('some');
  });

  it('a selection entirely on OTHER pages counts as none for this page', () => {
    expect(selectAllState(['a', 'b'], ['z'])).toBe('none');
  });

  it('an empty page is none, never all', () => {
    expect(selectAllState([], [])).toBe('none');
  });
});

describe('sortAccessibilityLabel', () => {
  it('names the header and the current direction', () => {
    expect(sortAccessibilityLabel('Score', 'asc')).toBe('Sort by Score, currently ascending');
    expect(sortAccessibilityLabel('Score', 'desc')).toBe('Sort by Score, currently descending');
    expect(sortAccessibilityLabel('Score', null)).toBe('Sort by Score, currently not sorted');
  });
});
