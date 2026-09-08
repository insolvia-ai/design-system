// WEB LEAF — plain React DOM + Tailwind. A real `<table>`, because that is
// the one thing that gives row/column navigation to a screen reader for free
// — see table.web.tsx's own header for the longer version of that argument;
// it applies here without change. What this leaf adds over `Table` is a
// generated `<thead>`/`<tbody>` from `columns`/`rows` instead of hand-written
// children, plus the sort button, the selection checkboxes and the footer.
//
// Cell padding (`px-sm`), the dense row heights (`h-9`/`h-12`) and the striped
// rule (`even:bg-surface-alt`) are the exact classes `table.web.tsx` uses —
// copied rather than imported, because Table exports no class-string
// constants to import (its own leaf hardcodes them too); this keeps a plain
// `<DataGrid>` visually identical to a hand-built `<Table>` with the same
// props, which is the point of sharing the visual language at all.
import * as React from 'react';

import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  cellContent,
  useDataGridState,
  type DataGridOwnProps,
  type DataGridSortDirection,
} from './data-grid.props';

export interface DataGridProps<Row>
  extends
    DataGridOwnProps<Row>,
    Omit<React.ComponentPropsWithoutRef<'table'>, keyof DataGridOwnProps<Row> | 'children'> {}

/** `▲`/`▼` for the active column, a fainter double-arrow for a sortable-but-unsorted one — `aria-hidden`, the state itself lives in `aria-sort`. */
function SortGlyph({ direction }: { direction: DataGridSortDirection | null }) {
  return (
    <span aria-hidden="true" className={cn('text-xs', direction === null && 'text-muted')}>
      {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
    </span>
  );
}

export function DataGrid<Row>({
  className,
  columns,
  rows,
  getRowId,
  sort,
  defaultSort,
  onSortChange,
  selectable = false,
  selected,
  defaultSelected,
  onSelectedChange,
  pageSize = 0,
  page,
  defaultPage,
  onPageChange,
  dense = false,
  striped = false,
  caption,
  emptyMessage = 'No rows',
  loading = false,
  ...props
}: DataGridProps<Row>) {
  const state = useDataGridState({
    columns,
    rows,
    getRowId,
    sort,
    defaultSort,
    onSortChange,
    selected,
    defaultSelected,
    onSelectedChange,
    pageSize,
    page,
    defaultPage,
    onPageChange,
  });

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = state.headerSelectState === 'some';
    }
  }, [state.headerSelectState]);

  const columnCount = columns.length + (selectable ? 1 : 0);
  const rowHeightClass = dense ? 'h-9' : 'h-12';

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto overscroll-contain">
        <table
          aria-busy={loading ? true : undefined}
          className={cn('w-full border-collapse font-body text-sm text-ink', className)}
          {...props}
        >
          {caption === undefined ? null : (
            <caption className="pb-sm text-left font-body text-sm text-muted">{caption}</caption>
          )}
          <thead className="border-b border-line">
            <tr>
              {selectable ? (
                <th scope="col" className={cn('w-10 px-sm', rowHeightClass)}>
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={state.headerSelectState === 'all'}
                    onChange={(event) => state.toggleAllSelected(event.target.checked)}
                    className={cn('size-4 touch-manipulation', focusRing)}
                  />
                </th>
              ) : null}
              {columns.map((column) => {
                const direction = state.sort?.key === column.key ? state.sort.direction : null;
                const alignEnd = column.align === 'end';
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      column.sortable
                        ? direction === 'asc'
                          ? 'ascending'
                          : direction === 'desc'
                            ? 'descending'
                            : 'none'
                        : undefined
                    }
                    style={{ width: column.width }}
                    className={cn(
                      'px-sm align-middle font-semibold text-muted',
                      rowHeightClass,
                      alignEnd ? 'text-right' : 'text-left',
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => state.toggleSort(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1 touch-manipulation',
                          alignEnd && 'flex-row-reverse',
                          focusRing,
                        )}
                      >
                        {column.header}
                        <SortGlyph direction={direction} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          {/* Dims only the body — never `thead`'s header cells or the footer
              below, both of which sit outside `tbody` entirely. `50` measured
              3.19:1 for ink-on-`bg`, under the 4.5:1 floor; `70` measures
              ≈5.6:1. */}
          <tbody className={loading ? 'opacity-70' : undefined}>
            {state.pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className={cn('px-sm text-center text-muted', rowHeightClass)}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              state.pageRows.map((row) => {
                const id = state.rowId(row);
                const isSelected = state.selected.includes(id);
                return (
                  <tr
                    key={id}
                    aria-selected={selectable ? isSelected : undefined}
                    data-state={selectable ? (isSelected ? 'selected' : 'unselected') : undefined}
                    className={cn(
                      'border-b border-line last:border-b-0',
                      striped && 'even:bg-surface-alt',
                    )}
                  >
                    {selectable ? (
                      <td className="px-sm align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Select row ${id}`}
                          checked={isSelected}
                          onChange={(event) => state.toggleRowSelected(id, event.target.checked)}
                          className={cn('size-4 touch-manipulation', focusRing)}
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-sm align-middle',
                          rowHeightClass,
                          column.align === 'end' && 'tabular-nums text-right',
                        )}
                      >
                        {cellContent(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageSize > 0 ? (
        <div className="flex items-center justify-between gap-sm px-sm py-xs text-sm text-muted">
          <span>{state.rangeText}</span>
          <div className="flex gap-xs">
            <button
              type="button"
              disabled={state.page <= 1}
              onClick={() => state.setPage(state.page - 1)}
              className={cn(
                'rounded-md border border-line px-sm py-1 text-ink touch-manipulation',
                'disabled:pointer-events-none disabled:opacity-50',
                focusRing,
              )}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={state.page >= state.pageCount}
              onClick={() => state.setPage(state.page + 1)}
              className={cn(
                'rounded-md border border-line px-sm py-1 text-ink touch-manipulation',
                'disabled:pointer-events-none disabled:opacity-50',
                focusRing,
              )}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
