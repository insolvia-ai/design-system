// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// EVERY piece of table structure is asserted by hand on this leaf — there is
// no `<table>` to inherit it from — so the roles are exactly what a native
// test has to pin. The striping index is the other half: it lives in the
// shared module precisely so the two leaves cannot shade opposite rows.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Table } from './table';

function Fleet({ striped = false }: { striped?: boolean }) {
  return (
    <Table.Root striped={striped}>
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
        <Table.Row testID="second-row">
          <Table.Cell>Kestrel</Table.Cell>
          <Table.Cell>11:15</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  );
}

describe('Table (native leaf)', () => {
  it('asserts the table roles by hand', () => {
    render(<Fleet />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('cell')).toHaveLength(4);
  });

  it('shades the SECOND body row — the same one the web leaf shades', () => {
    setPrefersColorScheme('light');
    render(<Fleet striped />);

    const second = screen.getByTestId('second-row');
    expect(rgb(getComputedStyle(second).backgroundColor)).toEqual(rgb(colors.light.surfaceAlt));
  });

  it('leaves the rows unshaded by default', () => {
    render(<Fleet />);

    expect(getComputedStyle(screen.getByTestId('second-row')).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    );
  });

  it('resolves cell colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');
    render(<Fleet />);

    expect(rgb(getComputedStyle(screen.getByText('Wayfarer')).color)).toEqual(rgb(colors.dark.ink));
  });

  it('drops the bottom rule on the LAST row of each section', () => {
    // The web leaf gets this from `last:border-b-0`; this leaf has no
    // selectors and must be told where a row sits. It shipped without the
    // rule, and the workbench showed a stray line under the native footer
    // that the web pane did not have.
    render(<Fleet />);

    const rows = screen.getAllByRole('row');
    const last = rows.at(-1)!;
    const firstBodyRow = rows[1]!;
    expect(getComputedStyle(last).borderBottomWidth).toBe('0px');
    expect(getComputedStyle(firstBodyRow).borderBottomWidth).toBe('1px');
  });
});
