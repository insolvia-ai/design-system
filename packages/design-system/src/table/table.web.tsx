// WEB LEAF — real table elements. `<table>` and friends carry the whole
// accessibility contract for free: a screen reader announces "row 3 of 12,
// column 2, Departure" only because the ELEMENTS say so, and no amount of
// `role` on a div gets a browser's table-navigation mode back.
//
// The Root wraps the table in an `overflow-x-auto` scroller, because a table
// that overflows its column takes the whole page's layout with it.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  TableContext,
  TableRowPositionContext,
  useTableContext,
  type TableRootOwnProps,
} from './table.props';

/**
 * Wraps a section's rows in their position.
 *
 * The web leaf could express both rules in CSS (`nth-child(even)`,
 * `last:border-b-0`) and does — this exists so the SECTIONS agree with the
 * native leaf about what "last" and "even" mean, rather than each platform
 * counting for itself. See table.props.ts.
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

export interface TableRootProps extends React.ComponentPropsWithoutRef<'table'>, TableRootOwnProps {
  /** Names the table for assistive tech. Rendered as a visible `<caption>`. */
  caption?: React.ReactNode;
}

const TableRoot = React.forwardRef<HTMLTableElement, TableRootProps>(
  ({ className, striped = false, dense = false, caption, children, ...props }, ref) => {
    const ctx = React.useMemo(() => ({ striped, dense }), [striped, dense]);
    return (
      <TableContext.Provider value={ctx}>
        <div className="w-full overflow-x-auto">
          <table
            ref={ref}
            className={cn('w-full border-collapse font-body text-sm text-ink', className)}
            {...props}
          >
            {caption === undefined ? null : (
              <caption className="pb-sm text-left font-body text-sm text-muted">{caption}</caption>
            )}
            {children}
          </table>
        </div>
      </TableContext.Provider>
    );
  },
);
TableRoot.displayName = 'Table.Root';

const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<'thead'>
>(({ className, children, ...props }, ref) => (
  <thead ref={ref} className={cn('border-b border-line', className)} {...props}>
    {positioned(children, false)}
  </thead>
));
TableHead.displayName = 'Table.Head';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<'tbody'>
>(({ className, children, ...props }, ref) => {
  return (
    <tbody ref={ref} className={className} {...props}>
      {positioned(children, true)}
    </tbody>
  );
});
TableBody.displayName = 'Table.Body';

const TableFoot = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentPropsWithoutRef<'tfoot'>
>(({ className, children, ...props }, ref) => (
  <tfoot ref={ref} className={cn('border-t border-line font-medium', className)} {...props}>
    {positioned(children, false)}
  </tfoot>
));
TableFoot.displayName = 'Table.Foot';

const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<'tr'>>(
  ({ className, ...props }, ref) => {
    const { striped } = useTableContext('Row');
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-line last:border-b-0',
          // `nth-child(even)` is the web spelling of `isStripedRow(index)` —
          // both mean "the second row and every other one after it".
          striped && 'even:bg-surface-alt',
          className,
        )}
        {...props}
      />
    );
  },
);
TableRow.displayName = 'Table.Row';

const TableHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentPropsWithoutRef<'th'>
>(({ className, scope = 'col', ...props }, ref) => {
  const { dense } = useTableContext('HeaderCell');
  return (
    <th
      ref={ref}
      // `scope` defaults to `col` because that is the overwhelmingly common
      // case and an unscoped header is ambiguous to a screen reader — a row
      // header passes `scope="row"`.
      scope={scope}
      className={cn(
        'px-sm text-left align-middle font-semibold text-muted',
        dense ? 'h-9' : 'h-12',
        className,
      )}
      {...props}
    />
  );
});
TableHeaderCell.displayName = 'Table.HeaderCell';

const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<'td'>>(
  ({ className, ...props }, ref) => {
    const { dense } = useTableContext('Cell');
    return (
      <td
        ref={ref}
        className={cn('px-sm align-middle', dense ? 'h-9' : 'h-12', className)}
        {...props}
      />
    );
  },
);
TableCell.displayName = 'Table.Cell';

export const Table = {
  Root: TableRoot,
  Head: TableHead,
  Body: TableBody,
  Foot: TableFoot,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
};
