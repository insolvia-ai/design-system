// SHARED — `react` and `../lib/controllable` only. No react-dom, no
// react-native. This is the whole grid's behaviour: sort cycling, pagination
// arithmetic, selection bookkeeping, and the value a cell/sort actually reads
// off a row. The leaves render elements — `<table>` on one side, a column of
// `View`s on the other — and nothing else.
//
// WHAT "MUI X DATAGRID AS REFERENCE" MEANS HERE, AND WHERE IT STOPS. Only the
// PROP SHAPE is borrowed — `columns`/`rows`/`getRowId`/a sort model/selection
// — because that shape is already how a consumer thinks about tabular data,
// and inventing a different one would cost a migration for no benefit. Three
// things MUI's DataGrid does are deliberately NOT here:
//   - virtualisation: it needs to MEASURE rows against a viewport, which is a
//     browser concept with no native analogue this package can give one
//     answer for. `Table` and this component both render every row.
//   - cell editing: a second interaction model (commit/cancel, validation,
//     an edit-mode cell renderer) big enough to be its own component.
//   - column resizing: a drag handle is desktop-only pointer interaction with
//     no accessible-by-default touch equivalent, and this package ships one
//     component for both platforms.
// A consumer that needs any of the three should reach for a dedicated grid
// library; this stays a sortable, selectable, paginated TABLE.
//
// WHY NOT JUST EXTEND `Table`. Table's compound parts (`Table.Row`,
// `Table.Cell`, …) are for HAND-WRITTEN markup — a caller who already knows
// its columns and writes JSX for each one. A `DataGridColumn[]` + `Row[]` pair
// is the opposite shape: the caller hands over data and this component
// decides how many `<tr>`s to emit, so composing Table's children API buys
// nothing. What DOES carry over is Table's visual language — cell padding,
// the dense/striped rules — which this file and the leaves match literally
// rather than reinvent, and `rowHeight` from `../table/table.props` is
// imported directly by the native leaf for exactly that reason.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

/**
 * One column's definition. Generic over the row type so a consumer's own
 * `columns` array is fully typed against its own data — `render`/`getValue`
 * take the real `Row`, not `unknown`.
 */
export interface DataGridColumn<Row> {
  /** Matches a `Row` property for the default cell/sort value. Must be unique. */
  key: string;
  /** Column header text. */
  header: string;
  /** Whether clicking the header cycles this column's sort. Off by default. */
  sortable?: boolean | undefined;
  /**
   * `'end'` right-aligns the column and sets tabular figures — the numeric
   * reading a `score`/`amount` column wants. `'start'` (the default) needs no
   * class of its own; text already reads that way.
   */
  align?: 'start' | 'end' | undefined;
  /** Fixed column width. Web: any CSS width. Native: px: see `NATIVE_COLUMN_WIDTH`. */
  width?: number | string | undefined;
  /** Cell content. Wins over `getValue` when both are given. */
  render?: ((row: Row) => React.ReactNode) | undefined;
  /**
   * The cell's plain value — read for sorting AND, absent `render`, for
   * display. Falls back to `row[key]` when omitted; give this whenever `key`
   * does not name a row property directly (a computed or nested value).
   */
  getValue?: ((row: Row) => string | number | null) | undefined;
}

export type DataGridSortDirection = 'asc' | 'desc';

export interface DataGridSort {
  /** A `DataGridColumn.key`. */
  key: string;
  direction: DataGridSortDirection;
}

/** `row.id`, cast rather than constrained — see `getRowId`'s doc for why. */
function defaultRowId<Row>(row: Row): string {
  const id = (row as { id?: unknown }).id;
  return typeof id === 'string' ? id : String(id);
}

/**
 * The value a cell displays, absent an explicit `render`: `getValue(row)` if
 * given, else the raw `row[key]`. Shared so the web and native leaves cannot
 * disagree about what an un-rendered cell shows — only how they wrap it
 * (a bare string on web, a `<Text>` on native).
 *
 * Not used for sorting — see `sortValueOf`, which deliberately ignores
 * `render` because a `ReactNode` has no defined order.
 */
export function cellContent<Row>(row: Row, column: DataGridColumn<Row>): React.ReactNode {
  if (column.render) return column.render(row);
  if (column.getValue) return column.getValue(row);
  return (row as Record<string, unknown>)[column.key] as React.ReactNode;
}

/**
 * The value a column sorts by: `getValue(row)` if given, else `row[key]` when
 * that happens to be a string or number, else `null`. `render` is never
 * consulted — a `ReactNode` (a badge, an icon) has no order a sort could use,
 * so a `sortable` column with only a `render` and no `getValue` sorts every
 * row as equal (stable — original order holds), which is the honest answer
 * rather than a crash or a coerced-to-string guess.
 */
function sortValueOf<Row>(row: Row, column: DataGridColumn<Row>): string | number | null {
  if (column.getValue) return column.getValue(row);
  const raw = (row as Record<string, unknown>)[column.key];
  return typeof raw === 'string' || typeof raw === 'number' ? raw : null;
}

/**
 * Rows in `sort` order — a fresh array, never a mutation of `rows`. `null`
 * sorts LAST regardless of direction (a missing score is not "the smallest
 * score"), and ties keep their original relative order: `Array.prototype.sort`
 * has been spec-stable since ES2019, so no decorate-sort-undecorate index is
 * needed to guarantee it, but the comparator still says so explicitly rather
 * than depending on a reader knowing that.
 *
 * `sort: null` (or a `key` naming no column) returns `rows` as a shallow copy,
 * unsorted — never throws, since a column can be removed out from under a
 * still-controlled `sort` prop mid-render.
 */
export function sortRows<Row>(
  rows: readonly Row[],
  sort: DataGridSort | null | undefined,
  columns: readonly DataGridColumn<Row>[],
): Row[] {
  if (!sort) return [...rows];
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column) return [...rows];
  const dir = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const va = sortValueOf(a, column);
    const vb = sortValueOf(b, column);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
    return cmp * dir;
  });
}

/**
 * One `pageSize`-row slice of `rows`, 1-based `page`. `pageSize <= 0` means
 * "pagination off" — the whole array comes back, matching the component's own
 * `pageSize = 0` default — so a caller never has to branch before calling
 * this. Out-of-range pages clamp to nothing (`[]`) rather than wrapping; the
 * component clamps `page` itself before calling, but the function stays
 * total either way.
 */
export function paginate<Row>(rows: readonly Row[], page: number, pageSize: number): Row[] {
  if (pageSize <= 0) return [...rows];
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

/** `1` when pagination is off, so a caller need not special-case it either. */
export function pageCount(total: number, pageSize: number): number {
  return pageSize <= 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
}

/** "1–10 of 42". An en dash, plain numbers — no `Intl`; see cn.ts's own note on locale-free formatting elsewhere in this package for the same reasoning. */
export function formatPageRange(start: number, end: number, total: number): string {
  if (total === 0) return '0–0 of 0';
  return `${start}–${end} of ${total}`;
}

/** asc → desc → none → asc. Clicking a DIFFERENT sortable header starts fresh at asc. */
export function nextSort(current: DataGridSort | null, key: string): DataGridSort | null {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return null;
}

/** Adds or removes one id from a selection array, without duplicating an already-selected id. */
export function toggleRow(selected: readonly string[], id: string, checked: boolean): string[] {
  if (checked) return selected.includes(id) ? [...selected] : [...selected, id];
  return selected.filter((existing) => existing !== id);
}

/**
 * Selecting/deselecting "all" acts on the CURRENT PAGE's rows only, and
 * leaves every other page's selection untouched — the header checkbox's
 * question is "every row I can currently see", not "every row that exists",
 * and losing page 1's picks while checking page 2 would be a hostile surprise
 * in a paginated grid.
 */
export function toggleAllOnPage(
  selected: readonly string[],
  pageRowIds: readonly string[],
  checked: boolean,
): string[] {
  const onPage = new Set(pageRowIds);
  const rest = selected.filter((id) => !onPage.has(id));
  return checked ? [...rest, ...pageRowIds] : rest;
}

export type DataGridSelectAllState = 'all' | 'some' | 'none';

/** The header checkbox's own state, derived from which of the CURRENT PAGE's rows are selected. */
export function selectAllState(
  pageRowIds: readonly string[],
  selected: readonly string[],
): DataGridSelectAllState {
  if (pageRowIds.length === 0) return 'none';
  const selectedSet = new Set(selected);
  const count = pageRowIds.filter((id) => selectedSet.has(id)).length;
  if (count === 0) return 'none';
  return count === pageRowIds.length ? 'all' : 'some';
}

/**
 * A sortable header's accessible name on native, where there is no `aria-sort`
 * attribute to read — react-native-web does not forward one, and a real
 * device has no such concept at all. The label carries the state itself, in
 * words, on every render: "Sort by Score, currently ascending" /
 * "…currently not sorted" — so a screen-reader user gets the same information
 * `aria-sort="ascending"` gives a web one, spoken instead of inferred.
 */
export function sortAccessibilityLabel(
  header: string,
  direction: DataGridSortDirection | null,
): string {
  const state =
    direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'not sorted';
  return `Sort by ${header}, currently ${state}`;
}

/** Column width on native, absent an explicit `column.width` — see the native leaf's header comment. */
export const NATIVE_COLUMN_WIDTH = 140;

export interface DataGridOwnProps<Row> {
  /** Column definitions, in display order. */
  columns: readonly DataGridColumn<Row>[];
  /** The rows to display, before sorting or paging. */
  rows: readonly Row[];
  /** Derives a stable string id per row. Defaults to `row.id`. */
  getRowId?: ((row: Row) => string) | undefined;

  /** Controlled sort. Pair with `onSortChange`. */
  sort?: DataGridSort | null | undefined;
  /** Uncontrolled starting sort. Defaults to unsorted. */
  defaultSort?: DataGridSort | null | undefined;
  onSortChange?: ((next: DataGridSort | null) => void) | undefined;

  /** Renders a leading checkbox column for row selection. Off by default. */
  selectable?: boolean | undefined;
  /** Controlled selection, as row ids. Pair with `onSelectedChange`. */
  selected?: string[] | undefined;
  /** Uncontrolled starting selection. Defaults to none selected. */
  defaultSelected?: string[] | undefined;
  onSelectedChange?: ((next: string[]) => void) | undefined;

  /** Rows per page. `0` (the default) turns pagination off — every row renders on one page. */
  pageSize?: number | undefined;
  /** Controlled current page, 1-based. Pair with `onPageChange`. */
  page?: number | undefined;
  /** Uncontrolled starting page. Defaults to 1. */
  defaultPage?: number | undefined;
  onPageChange?: ((next: number) => void) | undefined;

  /** Tightens row height, matching `Table`'s `dense`. */
  dense?: boolean | undefined;
  /** Shades every second body row, matching `Table`'s `striped`. */
  striped?: boolean | undefined;
  /** Names the grid for assistive tech. Web: a visible `<caption>`. Native: a header line above it. */
  caption?: string | undefined;
  /** Shown as one full-width cell when `rows` sorts/pages down to nothing. */
  emptyMessage?: string | undefined;
  /**
   * Marks the grid busy without touching `rows` — this component renders no
   * spinner or skeleton itself (that is a consumer's own overlay, composed on
   * top); `loading` only dims the rows and flags the busy state for assistive
   * tech, so a consumer's overlay is the only thing a user actually sees.
   */
  loading?: boolean | undefined;
}

export interface DataGridState<Row> {
  sort: DataGridSort | null;
  toggleSort: (key: string) => void;
  selected: string[];
  toggleRowSelected: (id: string, checked: boolean) => void;
  toggleAllSelected: (checked: boolean) => void;
  headerSelectState: DataGridSelectAllState;
  page: number;
  setPage: (next: number) => void;
  pageCount: number;
  pageRows: Row[];
  rangeText: string;
  total: number;
  rowId: (row: Row) => string;
}

/**
 * The whole grid's state in one hook: sort → sorted rows → paged rows,
 * selection scoped to the visible page, and the page arithmetic the footer
 * reads. One hook rather than three independent ones because pagination and
 * selection both need the SORTED, ALREADY-PAGED row ids (selection's "all on
 * this page" has to agree with what the footer calls "this page"), and
 * splitting it would mean either leaf recomputing that dependency chain by
 * hand — exactly the drift `useSelectState`/`usePaginationState` exist
 * elsewhere in this package to prevent.
 */
export function useDataGridState<Row>({
  columns,
  rows,
  getRowId,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  pageSize = 0,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
}: Pick<
  DataGridOwnProps<Row>,
  | 'columns'
  | 'rows'
  | 'getRowId'
  | 'sort'
  | 'defaultSort'
  | 'onSortChange'
  | 'selected'
  | 'defaultSelected'
  | 'onSelectedChange'
  | 'pageSize'
  | 'page'
  | 'defaultPage'
  | 'onPageChange'
>): DataGridState<Row> {
  const rowId = React.useCallback(
    (row: Row) => (getRowId ? getRowId(row) : defaultRowId(row)),
    [getRowId],
  );

  const [sort, setSort] = useControllableState<DataGridSort | null>(
    sortProp,
    defaultSort,
    onSortChange,
  );
  const [selected, setSelected] = useControllableState<string[]>(
    selectedProp,
    defaultSelected,
    onSelectedChange,
  );
  const [page, setPage] = useControllableState<number>(pageProp, defaultPage, onPageChange);

  const sortedRows = React.useMemo(() => sortRows(rows, sort, columns), [rows, sort, columns]);
  const total = sortedRows.length;
  const count = pageCount(total, pageSize);
  // Clamped for READING only — never fed back through `setPage`. A controlled
  // `page` that is temporarily out of range (rows just got filtered smaller
  // by the parent) still renders something sensible instead of an empty page,
  // without this hook silently overwriting a prop its owner controls.
  const clampedPage = pageSize > 0 ? Math.min(Math.max(page, 1), count) : 1;
  const pageRows = React.useMemo(
    () => paginate(sortedRows, clampedPage, pageSize),
    [sortedRows, clampedPage, pageSize],
  );
  const pageIds = React.useMemo(() => pageRows.map(rowId), [pageRows, rowId]);

  const toggleSort = React.useCallback(
    (key: string) => setSort(nextSort(sort, key)),
    [sort, setSort],
  );
  const toggleRowSelected = React.useCallback(
    (id: string, checked: boolean) => setSelected(toggleRow(selected, id, checked)),
    [selected, setSelected],
  );
  const toggleAllSelected = React.useCallback(
    (checked: boolean) => setSelected(toggleAllOnPage(selected, pageIds, checked)),
    [selected, pageIds, setSelected],
  );

  const headerSelectState = selectAllState(pageIds, selected);

  const rangeStart = total === 0 ? 0 : pageSize > 0 ? (clampedPage - 1) * pageSize + 1 : 1;
  const rangeEnd = pageSize > 0 ? Math.min(clampedPage * pageSize, total) : total;
  const rangeText = formatPageRange(rangeStart, rangeEnd, total);

  return React.useMemo(
    () => ({
      sort,
      toggleSort,
      selected,
      toggleRowSelected,
      toggleAllSelected,
      headerSelectState,
      page: clampedPage,
      setPage,
      pageCount: count,
      pageRows,
      rangeText,
      total,
      rowId,
    }),
    [
      sort,
      toggleSort,
      selected,
      toggleRowSelected,
      toggleAllSelected,
      headerSelectState,
      clampedPage,
      setPage,
      count,
      pageRows,
      rangeText,
      total,
      rowId,
    ],
  );
}
