import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Table } from './table';

function Fleet({ striped = false }: { striped?: boolean }) {
  return (
    <Table.Root striped={striped} caption="Fleet">
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Ship</Table.HeaderCell>
          <Table.HeaderCell>Departs</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Wayfarer</Table.Cell>
          <Table.Cell>09:40</Table.Cell>
        </Table.Row>
        <Table.Row data-testid="second-row">
          <Table.Cell>Kestrel</Table.Cell>
          <Table.Cell>11:15</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Foot>
        <Table.Row>
          <Table.Cell>2 ships</Table.Cell>
          <Table.Cell />
        </Table.Row>
      </Table.Foot>
    </Table.Root>
  );
}

describe('Table', () => {
  it('is a real table with real rows and cells', () => {
    render(<Fleet />);

    const table = screen.getByRole('table', { name: 'Fleet' });
    // 1 header + 2 body + 1 footer.
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
  });

  it('scopes its header cells to their column', () => {
    // An unscoped header is ambiguous to a screen reader.
    render(<Fleet />);

    expect(screen.getByRole('columnheader', { name: 'Ship' })).toHaveAttribute('scope', 'col');
  });

  it('stripes the second body row and no others when asked', () => {
    render(<Fleet striped />);

    expect(screen.getByTestId('second-row')).toHaveClass('even:bg-surface-alt');
  });

  it('does not stripe by default', () => {
    render(<Fleet />);

    expect(screen.getByTestId('second-row')).not.toHaveClass('even:bg-surface-alt');
  });

  it('throws when a part is used outside its Root', () => {
    expect(() => render(<Table.Cell>orphan</Table.Cell>)).toThrow(
      /Table.Cell must be rendered inside/,
    );
  });
});
