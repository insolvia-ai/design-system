// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colours resolve at
// render time; StyleSheet.create holds scheme-independent layout only.
//
// React Native has no table, so this borrows Table's own honesty about it
// (see table.native.tsx's header) rather than restating it: a horizontal
// `ScrollView` around a column of fixed-width `View` rows is a grid, not a
// `<table>`, and a screen reader gets no row/column navigation mode from it
// on a real device. `rowHeight` is imported directly from `../table/table.props`
// — the one piece of Table's shared module this leaf actually needs — so a
// dense DataGrid row is pixel-for-pixel the same height as a dense Table row.
//
// REAL TABLE ROLES. RN 0.86's `Role` union carries `table`/`row`/
// `columnheader`/`cell` (table.native.tsx's `webRole` cast predates this and
// is that leaf's own concern, not touched here), and react-native-web renders
// each as the matching ARIA role. The grid root is `role="table"`, with the
// caption doubling as its `accessibilityLabel`; the header row and every body
// row are `role="row"`; every header/body cell is `role="columnheader"` /
// `role="cell"`. A body row ALSO keeps a joined `accessibilityLabel`
// ("Ada Lovelace, London, 98") — a valid attribute on `row` — so
// VoiceOver/TalkBack can still announce the whole row as one summary, without
// the old `list`/`header`/`none` roles that put non-listitem children
// (buttons, headings, plain cells) directly under a `role="list"` root and
// failed axe's `list` rule on every story.
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { rowHeight } from '../table/table.props';
import {
  cellContent,
  NATIVE_COLUMN_WIDTH,
  sortAccessibilityLabel,
  useDataGridState,
  type DataGridColumn,
  type DataGridOwnProps,
  type DataGridSortDirection,
} from './data-grid.props';

export interface DataGridProps<Row> extends DataGridOwnProps<Row>, Omit<ViewProps, 'style'> {
  /** Plain style only (no function-of-press-state form) — see Field/Accordion/Checkbox. */
  style?: StyleProp<ViewStyle> | undefined;
}

function columnWidthStyle(width: number | string | undefined): ViewStyle {
  if (typeof width === 'number') return { width };
  if (typeof width === 'string') return { width: width as ViewStyle['width'] };
  return { width: NATIVE_COLUMN_WIDTH };
}

export function DataGrid<Row>({
  style,
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
  const c = useNativeColors();
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

  const cellHeight = dense ? rowHeight.dense : rowHeight.normal;

  return (
    <View style={[styles.root, style]} {...props}>
      {caption === undefined ? null : (
        <Text style={[styles.caption, { color: c.muted }]}>{caption}</Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Same reasoning as table.native.tsx: without `flexGrow` a horizontal
        // ScrollView sizes its content to the columns' own widths and never
        // divides the real viewport width among them.
        contentContainerStyle={styles.scrollContent}
      >
        <View
          role="table"
          accessibilityLabel={caption}
          // `busy`, not a bespoke prop: RN's own AccessibilityState carries it,
          // and it is the direct native counterpart of the web leaf's
          // `aria-busy`. Only body rows dim below (Loading contrast) — this
          // is the a11y half only.
          accessibilityState={{ busy: loading }}
          style={styles.grid}
        >
          <View role="row" style={[styles.headerRow, { borderBottomColor: c.line }]}>
            {selectable ? (
              <View role="columnheader" style={[styles.cell, styles.selectCell]}>
                <SelectAllCheckbox
                  state={state.headerSelectState}
                  onToggle={state.toggleAllSelected}
                />
              </View>
            ) : null}
            {columns.map((column) => (
              <HeaderCell
                key={column.key}
                column={column}
                direction={state.sort?.key === column.key ? state.sort.direction : null}
                onSort={() => state.toggleSort(column.key)}
              />
            ))}
          </View>

          <View style={loading ? styles.dimmedBody : null}>
            {state.pageRows.length === 0 ? (
              <View
                role="row"
                style={[styles.row, { minHeight: cellHeight, borderBottomColor: c.line }]}
              >
                <View role="cell" style={styles.emptyCell}>
                  <Text style={[styles.emptyText, { color: c.muted }]}>{emptyMessage}</Text>
                </View>
              </View>
            ) : (
              state.pageRows.map((row, index) => {
                const id = state.rowId(row);
                const isSelected = state.selected.includes(id);
                const isLast = index === state.pageRows.length - 1;
                return (
                  <DataRow
                    key={id}
                    row={row}
                    columns={columns}
                    id={id}
                    selectable={selectable}
                    selected={isSelected}
                    onToggle={(checked) => state.toggleRowSelected(id, checked)}
                    cellHeight={cellHeight}
                    striped={striped && index % 2 === 1}
                    isLast={isLast}
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {pageSize > 0 ? (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.muted }]}>{state.rangeText}</Text>
          <View style={styles.footerButtons}>
            <FooterButton
              label="Previous"
              disabled={state.page <= 1}
              onPress={() => state.setPage(state.page - 1)}
            />
            <FooterButton
              label="Next"
              disabled={state.page >= state.pageCount}
              onPress={() => state.setPage(state.page + 1)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function HeaderCell<Row>({
  column,
  direction,
  onSort,
}: {
  column: DataGridColumn<Row>;
  direction: DataGridSortDirection | null;
  onSort: () => void;
}) {
  const c = useNativeColors();
  const alignEnd = column.align === 'end';
  const content = (
    <Text
      style={[styles.headerText, { color: c.muted }, alignEnd ? styles.textEnd : null]}
      numberOfLines={1}
    >
      {column.header}
      {column.sortable ? (direction === 'asc' ? ' ▲' : direction === 'desc' ? ' ▼' : ' ⇅') : ''}
    </Text>
  );

  return (
    <View role="columnheader" style={[styles.cell, columnWidthStyle(column.width)]}>
      {column.sortable ? (
        <Pressable
          role="button"
          accessibilityLabel={sortAccessibilityLabel(column.header, direction)}
          onPress={onSort}
          style={styles.headerButton}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

function DataRow<Row>({
  row,
  columns,
  id,
  selectable,
  selected,
  onToggle,
  cellHeight,
  striped,
  isLast,
}: {
  row: Row;
  columns: readonly DataGridColumn<Row>[];
  id: string;
  selectable: boolean;
  selected: boolean;
  onToggle: (checked: boolean) => void;
  cellHeight: number;
  striped: boolean;
  isLast: boolean;
}) {
  const c = useNativeColors();

  // Joins every cell's plain text into the row's `accessibilityLabel` — a
  // valid attribute on `role="row"` — so VoiceOver/TalkBack can still read
  // the row as one summary ("Ada Lovelace, London, 98") the way a table row
  // is one navigable unit. Unlike the old grouped-`accessible` row, cells
  // stay individually reachable — the selection checkbox below is its own
  // `role="cell"` Pressable, not merged away. A non-string/number cell (a
  // rendered badge) contributes nothing to the join rather than
  // "[object Object]"; its own accessible content, if any, is reachable
  // through its own cell.
  const label = columns
    .map((column) => {
      const value = cellContent(row, column);
      return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
    })
    .filter((value): value is string => value !== null)
    .join(', ');

  return (
    <View
      role="row"
      accessibilityLabel={label}
      style={[
        styles.row,
        { minHeight: cellHeight, borderBottomColor: c.line },
        isLast ? styles.lastRow : null,
        striped ? { backgroundColor: c.surfaceAlt } : null,
      ]}
    >
      {selectable ? (
        <View role="cell" style={[styles.cell, styles.selectCell]}>
          <RowCheckbox id={id} checked={selected} onToggle={onToggle} />
        </View>
      ) : null}
      {columns.map((column) => {
        const value = cellContent(row, column);
        return (
          <View key={column.key} role="cell" style={[styles.cell, columnWidthStyle(column.width)]}>
            {typeof value === 'string' || typeof value === 'number' ? (
              <Text
                style={[
                  styles.cellText,
                  { color: c.ink },
                  column.align === 'end' ? styles.textEnd : null,
                ]}
                numberOfLines={1}
              >
                {value}
              </Text>
            ) : (
              value
            )}
          </View>
        );
      })}
    </View>
  );
}

function SelectAllCheckbox({
  state,
  onToggle,
}: {
  state: 'all' | 'some' | 'none';
  onToggle: (checked: boolean) => void;
}) {
  const c = useNativeColors();
  const r = useNativeRadii();
  const checked = state === 'all';
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel="Select all rows"
      accessibilityState={{ checked: state === 'some' ? 'mixed' : checked }}
      // `aria-checked` set directly, alongside `accessibilityState` — see
      // checkbox.native.tsx's header for why: this react-native-web version
      // does not derive the DOM's `aria-checked` from `accessibilityState`,
      // so only the latter would leave the web build's DOM (and this leaf's
      // own tests) with no observable checked state.
      aria-checked={state === 'some' ? 'mixed' : checked}
      onPress={() => onToggle(!checked)}
      style={[
        styles.checkbox,
        { borderRadius: r.sm },
        {
          borderColor: checked || state === 'some' ? c.primary : c.line,
          backgroundColor: checked || state === 'some' ? c.primary : c.card,
        },
      ]}
    >
      {checked || state === 'some' ? (
        <Text style={[styles.checkboxGlyph, { color: c.primaryText }]}>
          {state === 'some' ? '–' : '✓'}
        </Text>
      ) : null}
    </Pressable>
  );
}

function RowCheckbox({
  id,
  checked,
  onToggle,
}: {
  id: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const c = useNativeColors();
  const r = useNativeRadii();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`Select row ${id}`}
      accessibilityState={{ checked }}
      // See `SelectAllCheckbox` above: `aria-checked` set directly because
      // `accessibilityState` alone does not reach the DOM here.
      aria-checked={checked}
      onPress={() => onToggle(!checked)}
      style={[
        styles.checkbox,
        { borderRadius: r.sm },
        {
          borderColor: checked ? c.primary : c.line,
          backgroundColor: checked ? c.primary : c.card,
        },
      ]}
    >
      {checked ? <Text style={[styles.checkboxGlyph, { color: c.primaryText }]}>✓</Text> : null}
    </Pressable>
  );
}

function FooterButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useNativeColors();
  const r = useNativeRadii();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.footerButton,
        { borderRadius: r.md, borderColor: c.line, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={[styles.footerButtonText, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  caption: { ...textScale.sm, paddingBottom: spacing.sm },
  scrollContent: { flexGrow: 1 },
  grid: { minWidth: '100%' },
  // Loading dims only the body rows (see this file's header on `table`/`row`/
  // `cell` roles) — never the header or footer. 0.5 measured at 3.19:1 for
  // ink-on-`bg`, under the 4.5:1 floor; 0.7 measures ≈5.6:1.
  dimmedBody: { opacity: 0.7 },
  headerRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  // Fills its `role="columnheader"` cell so the tap target matches the old
  // Pressable-is-the-cell layout.
  headerButton: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  lastRow: { borderBottomWidth: 0 },
  // Fixed, not flexible — see this file's header comment. Every column gets
  // an explicit width, from `column.width` or the `NATIVE_COLUMN_WIDTH`
  // default, so the header row and every data row divide the same way and
  // stay aligned regardless of what a given cell's content measures.
  cell: { justifyContent: 'center', paddingHorizontal: spacing.sm },
  selectCell: { width: 40, alignItems: 'flex-start' },
  headerText: { ...textScale.sm, fontWeight: '600' },
  cellText: { ...textScale.sm },
  textEnd: { textAlign: 'right' },
  emptyCell: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.sm },
  emptyText: { ...textScale.sm, textAlign: 'center' },
  // `borderRadius` applied at render time via `useNativeRadii()` — see this
  // file's header and CLAUDE.md's radii-at-render-time rule.
  checkbox: {
    height: 20,
    width: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxGlyph: { fontSize: 14, fontWeight: '700', lineHeight: 16 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  footerText: { ...textScale.sm },
  footerButtons: { flexDirection: 'row', gap: spacing.xs },
  // `borderRadius` applied at render time via `useNativeRadii()`.
  footerButton: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footerButtonText: { ...textScale.sm },
});
