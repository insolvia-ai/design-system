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

/**
 * A body row's position, provided by `Table.Body`.
 *
 * WHY AN INDEX AT ALL. On web, striping is `nth-child(even)` and no component
 * needs to count. React Native has no selectors, so its rows have to be told
 * where they sit — and rather than let each leaf invent its own counting, the
 * Body on BOTH leaves wraps its children in this, so "even rows are shaded"
 * means the same row on each platform. Getting that wrong is invisible to
 * every test and obvious in the workbench: two tables striped in antiphase.
 *
 * `null` outside a body — a header or footer row is never striped.
 */
export const TableRowIndexContext = React.createContext<number | null>(null);

export function useRowIndex(): number | null {
  return React.useContext(TableRowIndexContext);
}

/** Zero-based, so the SECOND row (index 1) is the first shaded one. */
export function isStripedRow(index: number | null): boolean {
  return index !== null && index % 2 === 1;
}

export const rowHeight = { normal: 48, dense: 36 } as const;
