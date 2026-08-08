// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// React Native has no table elements, so every piece of structure the web leaf
// gets free from `<table>` is asserted here by hand: `role="table"`, `row`,
// `columnheader`, `cell`. RN's `Role` union carries none of them, and
// react-native-web forwards the string to the DOM regardless — the same
// omission select.native.tsx documents for `listbox`, and the same contained
// cast.
//
// BE HONEST ABOUT WHAT THIS IS. A grid of Views with ARIA roles is not a
// `<table>`: a screen reader on the web gets most of the way there, and on a
// real device the platform has no table navigation mode to enter. For a wide
// data table on native, a list of cards usually serves a user better than a
// table that has to be scrolled in two directions. This exists so a
// cross-platform screen can render one, not to claim parity that is not there.
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  isLastRow,
  isStripedRow,
  rowHeight,
  TableContext,
  TableRowPositionContext,
  useRowPosition,
  useTableContext,
  type TableRootOwnProps,
} from './table.props';

/** Applies a role react-native-web forwards but RN's own types do not admit. */
function webRole(role: string): Partial<ViewProps> {
  return { role } as unknown as Partial<ViewProps>;
}

/**
 * Wraps a section's rows in their position — the same wrapping the web leaf
 * does, so both agree on which row is "even" and which is "last". This leaf
 * has no selectors to fall back on; see table.props.ts.
 */
function positioned(children: React.ReactNode, striping: boolean): React.ReactNode {
  const rows = React.Children.toArray(children);
  return rows.map((row, index) => (
    <TableRowPositionContext.Provider
      key={index}
      value={{ index, isLast: index === rows.length - 1, striping }}
    >
      {row}
    </TableRowPositionContext.Provider>
  ));
}

export interface TableRootProps extends ViewProps, TableRootOwnProps {
  caption?: React.ReactNode;
  children?: React.ReactNode;
}

const TableRoot = ({
  striped = false,
  dense = false,
  caption,
  style,
  children,
  ...props
}: TableRootProps) => {
  const c = useNativeColors();
  const ctx = React.useMemo(() => ({ striped, dense }), [striped, dense]);
  return (
    <TableContext.Provider value={ctx}>
      <View style={styles.wrapper}>
        {caption === undefined ? null : (
          <Text style={[styles.caption, { color: c.muted }]}>{caption}</Text>
        )}
        {/* Horizontal scroll, matching the web leaf's `overflow-x-auto`: a
            table wider than its column must scroll itself rather than take
            the screen's layout with it.

            `contentContainerStyle={{ flexGrow: 1 }}` is load-bearing. A
            horizontal ScrollView sizes its content to CONTENT, so `flex: 1`
            cells have no definite width to divide and collapse to their
            `minWidth` — measured at 360px against the web leaf's 522px in the
            same pane, which read as a table that had given up on the right
            third of its column. `flexGrow` makes the content container at
            least as wide as the viewport, so the cells divide the real width
            and only scroll once their minimums genuinely exceed it. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View {...webRole('table')} style={[styles.table, style]} {...props}>
            {children}
          </View>
        </ScrollView>
      </View>
    </TableContext.Provider>
  );
};

const TableHead = ({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) => {
  const c = useNativeColors();
  return (
    <View
      {...webRole('rowgroup')}
      style={[styles.head, { borderBottomColor: c.line }, style]}
      {...props}
    >
      {positioned(children, false)}
    </View>
  );
};

const TableBody = ({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) => (
  <View {...webRole('rowgroup')} style={style} {...props}>
    {positioned(children, true)}
  </View>
);

const TableFoot = ({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) => {
  const c = useNativeColors();
  return (
    <View
      {...webRole('rowgroup')}
      style={[styles.foot, { borderTopColor: c.line }, style]}
      {...props}
    >
      {positioned(children, false)}
    </View>
  );
};

const TableRow = ({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) => {
  const { striped, dense } = useTableContext('Row');
  const position = useRowPosition();
  const c = useNativeColors();
  return (
    <View
      {...webRole('row')}
      style={[
        styles.row,
        { minHeight: dense ? rowHeight.dense : rowHeight.normal, borderBottomColor: c.line },
        // The section owns its bottom edge, so the last row drops its own rule
        // — the native counterpart of the web leaf's `last:border-b-0`.
        isLastRow(position) ? styles.lastRow : null,
        striped && isStripedRow(position) ? { backgroundColor: c.surfaceAlt } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export interface TableCellProps extends ViewProps {
  children?: React.ReactNode;
  /** Fixed column width. Without one, cells share the row evenly. */
  width?: number | undefined;
}

const TableHeaderCell = ({ style, width, children, ...props }: TableCellProps) => {
  const c = useNativeColors();
  return (
    <View
      {...webRole('columnheader')}
      style={[styles.cell, width === undefined ? styles.flexCell : { width }, style]}
      {...props}
    >
      <Text style={[styles.headerText, { color: c.muted }]}>{children}</Text>
    </View>
  );
};

const TableCell = ({ style, width, children, ...props }: TableCellProps) => {
  const c = useNativeColors();
  return (
    <View
      {...webRole('cell')}
      style={[styles.cell, width === undefined ? styles.flexCell : { width }, style]}
      {...props}
    >
      {/* A string child is wrapped so it inherits the ink colour; anything
          else is passed through, because a cell may hold a Badge or a Button
          that owns its own colour. */}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[styles.cellText, { color: c.ink }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

export const Table = {
  Root: TableRoot,
  Head: TableHead,
  Body: TableBody,
  Foot: TableFoot,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  scrollContent: { flexGrow: 1 },
  caption: { ...textScale.sm, paddingBottom: spacing.sm },
  table: { minWidth: '100%' },
  head: { borderBottomWidth: 1 },
  foot: { borderTopWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  lastRow: { borderBottomWidth: 0 },
  cell: { justifyContent: 'center', paddingHorizontal: spacing.sm },
  flexCell: { flex: 1, minWidth: 120 },
  headerText: { ...textScale.sm, fontWeight: '600' },
  cellText: { ...textScale.sm },
});
