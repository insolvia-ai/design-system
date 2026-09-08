// WEB-leaf behavioural tests. The sort/paginate/select ALGORITHMS are pinned
// once in data-grid.props.test.ts; these pin this leaf's DOM wiring of them —
// the elements, the ARIA, and that a click/change event reaches the right
// callback.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataGrid } from './data-grid';
import type { DataGridColumn, DataGridSort } from './data-grid.props';

interface Row {
  id: string;
  name: string;
  score: number;
}

const columns: DataGridColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'score', header: 'Score', sortable: true, align: 'end' },
];

const rows: Row[] = [
  { id: 'a', name: 'Ada', score: 30 },
  { id: 'b', name: 'Bea', score: 10 },
  { id: 'c', name: 'Cy', score: 20 },
];

describe('DataGrid (web leaf)', () => {
  it('renders a column per header and a cell per row', () => {
    render(<DataGrid columns={columns} rows={rows} />);

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Score' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1); // + header row
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '10' })).toBeInTheDocument();
  });

  it('a render column wins over getValue and the raw row value', () => {
    const withRender: DataGridColumn<Row>[] = [
      ...columns,
      { key: 'name', header: 'Tag', render: (row) => `#${row.name}` },
    ];
    render(<DataGrid columns={withRender} rows={rows.slice(0, 1)} />);

    expect(screen.getByRole('cell', { name: '#Ada' })).toBeInTheDocument();
  });

  it('clicking a sortable header cycles asc → desc → none and fires onSortChange each time', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<DataGrid columns={columns} rows={rows} onSortChange={onSortChange} />);

    const header = screen.getByRole('columnheader', { name: 'Score' });
    await user.click(within(header).getByRole('button'));
    expect(onSortChange).toHaveBeenNthCalledWith(1, { key: 'score', direction: 'asc' });
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(header).getByRole('button'));
    expect(onSortChange).toHaveBeenNthCalledWith(2, { key: 'score', direction: 'desc' });
    expect(header).toHaveAttribute('aria-sort', 'descending');

    await user.click(within(header).getByRole('button'));
    expect(onSortChange).toHaveBeenNthCalledWith(3, null);
    expect(header).toHaveAttribute('aria-sort', 'none');
  });

  it('sorting actually reorders the rendered rows', async () => {
    const user = userEvent.setup();
    render(<DataGrid columns={columns} rows={rows} />);

    const cellsInOrder = () =>
      screen
        .getAllByRole('cell')
        .filter((_, i) => i % 2 === 0)
        .map((c) => c.textContent);
    expect(cellsInOrder()).toEqual(['Ada', 'Bea', 'Cy']);

    await user.click(
      within(screen.getByRole('columnheader', { name: 'Score' })).getByRole('button'),
    );

    expect(cellsInOrder()).toEqual(['Bea', 'Cy', 'Ada']); // 10, 20, 30 ascending
  });

  it('a non-sortable header renders plain text with no button and no aria-sort', () => {
    const plain: DataGridColumn<Row>[] = [{ key: 'name', header: 'Name' }];
    render(<DataGrid columns={plain} rows={rows} />);

    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(within(header).queryByRole('button')).not.toBeInTheDocument();
  });

  it('select-all checks every row on the page and fires onSelectedChange with their ids', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <DataGrid columns={columns} rows={rows} selectable onSelectedChange={onSelectedChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(onSelectedChange).toHaveBeenCalledWith(['a', 'b', 'c']);
    for (const row of rows) {
      expect(screen.getByRole('checkbox', { name: `Select row ${row.id}` })).toBeChecked();
    }
  });

  it('checking one row fires onSelectedChange with just that id', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <DataGrid columns={columns} rows={rows} selectable onSelectedChange={onSelectedChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select row b' }));

    expect(onSelectedChange).toHaveBeenCalledWith(['b']);
  });

  it('a partially selected page reports data-state="selected" only on the checked row', () => {
    render(<DataGrid columns={columns} rows={rows} selectable defaultSelected={['b']} />);

    const selectedRow = screen.getByRole('checkbox', { name: 'Select row b' }).closest('tr');
    const otherRow = screen.getByRole('checkbox', { name: 'Select row a' }).closest('tr');
    expect(selectedRow).toHaveAttribute('data-state', 'selected');
    expect(otherRow).toHaveAttribute('data-state', 'unselected');
  });

  it('shows a "start–end of total" footer and disables Next on the last page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<DataGrid columns={columns} rows={rows} pageSize={2} onPageChange={onPageChange} />);

    expect(screen.getByText('1–2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByText('3–3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('renders no footer at all when pageSize is 0 (the default)', () => {
    render(<DataGrid columns={columns} rows={rows} />);
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('renders the empty message as one full-width cell when there are no rows', () => {
    render(<DataGrid columns={columns} rows={[]} emptyMessage="Nothing to show" />);

    const cell = screen.getByRole('cell', { name: 'Nothing to show' });
    expect(cell).toHaveAttribute('colspan', String(columns.length));
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + the empty row
  });

  it('marks the table aria-busy when loading', () => {
    const { rerender } = render(<DataGrid columns={columns} rows={rows} />);
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');

    rerender(<DataGrid columns={columns} rows={rows} loading />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });

  it('the table sits inside a horizontally-scrolling container', () => {
    render(<DataGrid columns={columns} rows={rows} />);

    const table = screen.getByRole('table');
    const scroller = table.parentElement;
    expect(scroller).toHaveClass('overflow-x-auto');
    expect(scroller).toHaveClass('overscroll-contain');
  });

  it('a controlled sort renders the given order and re-renders when it changes', () => {
    const asc: DataGridSort = { key: 'score', direction: 'asc' };
    const { rerender } = render(<DataGrid columns={columns} rows={rows} sort={asc} />);
    const namesAsc = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0]?.textContent);
    expect(namesAsc).toEqual(['Bea', 'Cy', 'Ada']);

    rerender(<DataGrid columns={columns} rows={rows} sort={{ key: 'score', direction: 'desc' }} />);
    const namesDesc = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0]?.textContent);
    expect(namesDesc).toEqual(['Ada', 'Cy', 'Bea']);
  });
});
