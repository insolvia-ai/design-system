// NATIVE-leaf tests — see checkbox.native.test.tsx for how the `native`
// vitest project resolves './data-grid' to data-grid.native.tsx and renders
// it through react-native-web. These pin the a11y wiring the web tests can't
// speak to: the sort Pressable's label, the checkbox Pressable's state, the
// row's joined accessibilityLabel, the `row`/`cell` roles that carry it, and
// render-time colour resolution.
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { DataGrid } from './data-grid';
import type { DataGridColumn } from './data-grid.props';

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
];

describe('DataGrid (native leaf)', () => {
  it('a sortable header is a button naming the column and its current direction, and pressing it fires onSortChange', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<DataGrid columns={columns} rows={rows} onSortChange={onSortChange} />);

    const button = screen.getByRole('button', { name: 'Sort by Score, currently not sorted' });
    await user.click(button);

    expect(onSortChange).toHaveBeenCalledWith({ key: 'score', direction: 'asc' });
  });

  it('the sort label updates to say the current direction', () => {
    render(<DataGrid columns={columns} rows={rows} sort={{ key: 'score', direction: 'desc' }} />);

    expect(
      screen.getByRole('button', { name: 'Sort by Score, currently descending' }),
    ).toBeInTheDocument();
  });

  it('pressing a row checkbox fires onSelectedChange with that row selected', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <DataGrid columns={columns} rows={rows} selectable onSelectedChange={onSelectedChange} />,
    );

    const box = screen.getByRole('checkbox', { name: 'Select row a' });
    expect(box).toHaveAttribute('aria-checked', 'false');

    await user.click(box);

    expect(onSelectedChange).toHaveBeenCalledWith(['a']);
  });

  it('pressing the select-all checkbox selects every row on the page', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <DataGrid columns={columns} rows={rows} selectable onSelectedChange={onSelectedChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(onSelectedChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it("a body row is role='row', named by its joined cell values, and its cells are role='cell'", () => {
    render(<DataGrid columns={columns} rows={rows} />);

    const adaRow = screen.getByRole('row', { name: 'Ada, 30' });
    expect(adaRow).toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'Bea, 10' })).toBeInTheDocument();

    const { getAllByRole } = within(adaRow);
    expect(getAllByRole('cell')).toHaveLength(columns.length);
  });

  it('the header row is role="row" and its cells are role="columnheader"', () => {
    render(<DataGrid columns={columns} rows={rows} />);

    const headerRow = screen.getAllByRole('row')[0]!;
    expect(within(headerRow).getAllByRole('columnheader')).toHaveLength(columns.length);
  });

  // The 0.18.0 regression, recurring: this leaf shipped in 0.21.0 with no
  // `useNativeFocusRing` at all, so every one of its controls fell through to
  // Chrome's blue `outline-style: auto` under react-native-web while the web
  // leaf drew the package's own ring. A grid is tabbed through end to end, so
  // it is the surface where that is most visible. Each control is asserted
  // separately because each owns its own hook instance — one instance holds a
  // single boolean and could not serve them all.
  describe('draws the design system’s OWN focus ring, not the browser default', () => {
    it.each([
      ['a sortable column header', 'button', 'Sort by Name, currently not sorted'],
      ['the select-all checkbox', 'checkbox', 'Select all rows'],
      ['a row checkbox', 'checkbox', 'Select row a'],
      ['a footer button', 'button', 'Next'],
    ])('%s', (_label, role, name) => {
      setPrefersColorScheme('light');
      render(<DataGrid columns={columns} rows={rows} selectable pageSize={1} />);

      const control = screen.getByRole(role, { name });
      expect(getComputedStyle(control).outlineWidth).not.toBe('2px');

      act(() => control.focus());

      const style = getComputedStyle(control);
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
    });
  });

  // Each control owning its own instance is the point — a shared one would
  // light up every checkbox in the grid the moment any single one took focus.
  it('rings only the focused control, not its siblings', () => {
    setPrefersColorScheme('light');
    render(<DataGrid columns={columns} rows={rows} selectable />);

    const ada = screen.getByRole('checkbox', { name: 'Select row a' });
    const bea = screen.getByRole('checkbox', { name: 'Select row b' });

    act(() => ada.focus());

    expect(getComputedStyle(ada).outlineWidth).toBe('2px');
    expect(getComputedStyle(bea).outlineWidth).not.toBe('2px');
    expect(
      getComputedStyle(screen.getByRole('checkbox', { name: 'Select all rows' })).outlineWidth,
    ).not.toBe('2px');
  });

  // The ring follows the active scheme like every other native colour — it
  // resolves from `useNativeColors()` at render time, not at module load.
  it('resolves the ring colour from the active scheme', () => {
    setPrefersColorScheme('dark');
    render(<DataGrid columns={columns} rows={rows} selectable />);

    const control = screen.getByRole('checkbox', { name: 'Select all rows' });
    act(() => control.focus());

    expect(rgb(getComputedStyle(control).outlineColor)).toEqual(rgb(colors.dark.accent));
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark-scheme colors for row text', () => {
    setPrefersColorScheme('dark');

    render(<DataGrid columns={columns} rows={rows} />);

    const cell = screen.getByText('Ada');
    expect(rgb(cell.style.color)).toEqual(rgb(colors.dark.ink));
  });
});
