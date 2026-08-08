// SHARED — `react` only (context). No react-dom, no react-native.
//
// A table's substance is its SEMANTICS, and those are the one thing the two
// platforms spell completely differently: the web leaf gets `table`, `row`,
// `columnheader` and `cell` free from the elements, while the native leaf has
// to assert every one of them by hand on a View. What can be shared is the
// striping rule and the row indices it needs.
import * as React from 'react';

export interface TableRootOwnProps {
  /**
   * Shades every second body row. Off by default: a stripe is a reading aid
   * for wide tables and noise on a three-column one.
   */
  striped?: boolean | undefined;
  /** Tightens the row height for dense data. */
  dense?: boolean | undefined;
}

export interface TableContextValue {
  striped: boolean;
  dense: boolean;
}

export const TableContext = React.createContext<TableContextValue | null>(null);

export function useTableContext(part: string): TableContextValue {
  const ctx = React.useContext(TableContext);
  if (!ctx) throw new Error(`Table.${part} must be rendered inside <Table.Root>`);
  return ctx;
}

export interface TableRowPosition {
  /** Zero-based, within the row's own section. */
  index: number;
  /** Last row of its section — head, body or foot. */
  isLast: boolean;
  /** Only body rows stripe; a header or footer row never does. */
  striping: boolean;
}

/**
 * A row's position, provided by whichever section contains it.
 *
 * WHY POSITION AT ALL. On web this is free: striping is `nth-child(even)` and
 * dropping the last rule is `last:border-b-0`. React Native has no selectors,
 * so its rows have to be TOLD where they sit — and rather than let each leaf
 * invent its own counting, every section on BOTH leaves wraps its children in
 * this. "Even rows are shaded" then means the same row on each platform, and
 * so does "the last row has no rule under it".
 *
 * Getting either wrong is invisible to every test and obvious in the
 * workbench: two tables striped in antiphase, or a stray line under one
 * table's footer and not the other's. The second one shipped — this context
 * carried only an index at first, and the native footer kept a border the web
 * leaf dropped.
 */
export const TableRowPositionContext = React.createContext<TableRowPosition | null>(null);

export function useRowPosition(): TableRowPosition | null {
  return React.useContext(TableRowPositionContext);
}

/** Zero-based, so the SECOND row (index 1) is the first shaded one. */
export function isStripedRow(position: TableRowPosition | null): boolean {
  return position !== null && position.striping && position.index % 2 === 1;
}

/** The last row of a section drops its bottom rule — the section owns that edge. */
export function isLastRow(position: TableRowPosition | null): boolean {
  return position !== null && position.isLast;
}

export const rowHeight = { normal: 48, dense: 36 } as const;
