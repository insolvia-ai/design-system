import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { DataGrid as DataGridWeb } from '@design-system/data-grid/data-grid.web.tsx';
import { DataGrid as DataGridNative } from '@design-system/data-grid/data-grid.native.tsx';
import type { DataGridColumn } from '@design-system/data-grid/data-grid.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

interface Row {
  id: string;
  name: string;
  city: string;
  score: number;
}

const ROWS: Row[] = [
  { id: 'c1', name: 'Ava Ondrik', city: 'New Kyiv', score: 74 },
  { id: 'c2', name: 'Ben Solari', city: 'Meridian', score: 61 },
  { id: 'c3', name: 'Cato Reyes', city: 'Alto Vista', score: 88 },
  { id: 'c4', name: 'Dara Finch', city: 'Wayfarer Bay', score: 95 },
  { id: 'c5', name: 'Elin Voss', city: 'Cobalt Reach', score: 52 },
  { id: 'c6', name: 'Farid Amos', city: 'Sable Point', score: 67 },
  { id: 'c7', name: 'Greta Okafor', city: 'Ironmoor', score: 83 },
  { id: 'c8', name: 'Hale Suzuki', city: 'Driftholm', score: 91 },
  { id: 'c9', name: 'Ines Barros', city: 'Northgate', score: 58 },
  { id: 'c10', name: 'Jonas Krieg', city: 'Amber Falls', score: 77 },
  { id: 'c11', name: 'Kira Novak', city: 'Halcyon', score: 99 },
  { id: 'c12', name: 'Leo Marsh', city: 'Tidewell', score: 45 },
];

const COLUMNS: DataGridColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'city', header: 'City' },
  { key: 'score', header: 'Score', sortable: true, align: 'end' },
];

/**
 * Args are typed against `data-grid.props.ts`'s `DataGridOwnProps`, not either
 * leaf — both leaves take every one of these under the same name, so no
 * bridging arg is needed. `columns`/`rows` get no control (there is nothing a
 * Controls-panel editor could sensibly do with either), and every handler is a
 * shared `fn()` so a play can assert its call count per pane.
 */
type DataGridArgs = {
  columns: readonly DataGridColumn<Row>[];
  rows: readonly Row[];
  selectable: boolean;
  pageSize: number;
  dense: boolean;
  striped: boolean;
  caption: string;
  emptyMessage: string;
  loading: boolean;
  onSortChange: (next: { key: string; direction: 'asc' | 'desc' } | null) => void;
  onSelectedChange: (next: string[]) => void;
  onPageChange: (next: number) => void;
};

/**
 * A sortable, selectable, paginated table driven by `columns` + `rows`,
 * rather than hand-written markup — `Table` (see `Data display/Table`) is for
 * the latter, and this component borrows only its visual language: cell
 * padding, the dense row height, the striped rule.
 *
 * MUI X DataGrid is the reference for the PROP SHAPE only —
 * `columns`/`rows`/`getRowId`/a sort model/a selection array is a shape
 * consumers already know. Three things it does are deliberately absent:
 * virtualisation (a browser-only concept with no native analogue), cell
 * editing (a second interaction model big enough to be its own component),
 * and column resizing (a desktop-only drag gesture with no accessible-by-
 * default touch equivalent). Every row renders, always; a consumer needing
 * any of the three should reach for a dedicated grid library.
 *
 * Compare the panes on: whether a header click sorts both the same way,
 * whether the header checkbox's indeterminate state agrees, whether the
 * footer's "start–end of total" text and disabled Next match, and whether an
 * `align: 'end'` column lines up its numbers the same way on both sides.
 */
const meta = {
  title: 'Data display/DataGrid',
  component: DataGridWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    columns: COLUMNS,
    rows: ROWS,
    selectable: true,
    pageSize: 5,
    dense: false,
    striped: false,
    caption: 'Crew roster',
    emptyMessage: 'No rows',
    loading: false,
    onSortChange: fn(),
    onSelectedChange: fn(),
    onPageChange: fn(),
  },
  argTypes: {
    columns: { control: false },
    rows: { control: false },
    selectable: { control: 'boolean' },
    pageSize: { control: { type: 'number', min: 0 } },
    dense: { control: 'boolean' },
    striped: { control: 'boolean' },
    caption: { control: 'text' },
    emptyMessage: { control: 'text' },
    loading: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={480}
      web={
        <DataGridWeb
          columns={args.columns}
          rows={args.rows}
          selectable={args.selectable}
          pageSize={args.pageSize}
          dense={args.dense}
          striped={args.striped}
          caption={args.caption}
          emptyMessage={args.emptyMessage}
          loading={args.loading}
          onSortChange={args.onSortChange}
          onSelectedChange={args.onSelectedChange}
          onPageChange={args.onPageChange}
        />
      }
      native={
        <DataGridNative
          columns={args.columns}
          rows={args.rows}
          selectable={args.selectable}
          pageSize={args.pageSize}
          dense={args.dense}
          striped={args.striped}
          caption={args.caption}
          emptyMessage={args.emptyMessage}
          loading={args.loading}
          onSortChange={args.onSortChange}
          onSelectedChange={args.onSelectedChange}
          onPageChange={args.onPageChange}
        />
      }
    />
  ),
} satisfies Meta<DataGridArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Twelve rows, five to a page, selectable. The play drives one full round
 * trip per pane — sort by Score, select the row that sorts to the top,
 * page forward — and ends on page 2 with the sort still applied, which is
 * the state axe audits after the play runs.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);

    // Sort by Score in each pane. The web header is a `<button>` named
    // "Score" (the glyph beside it is `aria-hidden`); the native header
    // carries no `aria-sort` to read, so its accessible name states the
    // sort state in words instead — see `sortAccessibilityLabel`.
    await userEvent.click(web.getByRole('button', { name: 'Score' }));
    await expect(args.onSortChange).toHaveBeenCalledTimes(1);
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'score', direction: 'asc' });

    await userEvent.click(
      native.getByRole('button', { name: 'Sort by Score, currently not sorted' }),
    );
    await expect(args.onSortChange).toHaveBeenCalledTimes(2);
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'score', direction: 'asc' });

    // Select the row that sorted to the top of each pane (checkbox index 0 is
    // "select all"; index 1 is the first data row) — read its id off the
    // checkbox's own accessible name rather than hard-coding one, so this
    // survives a reordering of ROWS above.
    const webCheckboxes = web.getAllByRole('checkbox');
    const webFirstId = webCheckboxes[1]?.getAttribute('aria-label')?.replace('Select row ', '');
    await userEvent.click(webCheckboxes[1]!);
    await expect(args.onSelectedChange).toHaveBeenCalledTimes(1);
    await expect(args.onSelectedChange).toHaveBeenLastCalledWith([webFirstId]);

    const nativeCheckboxes = native.getAllByRole('checkbox');
    const nativeFirstId = nativeCheckboxes[1]
      ?.getAttribute('aria-label')
      ?.replace('Select row ', '');
    await userEvent.click(nativeCheckboxes[1]!);
    await expect(args.onSelectedChange).toHaveBeenCalledTimes(2);
    await expect(args.onSelectedChange).toHaveBeenLastCalledWith([nativeFirstId]);

    await userEvent.click(web.getByRole('button', { name: 'Next' }));
    await expect(args.onPageChange).toHaveBeenCalledTimes(1);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);

    await userEvent.click(native.getByRole('button', { name: 'Next' }));
    await expect(args.onPageChange).toHaveBeenCalledTimes(2);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
  },
};

/** Tighter rows for dense data — matches `Table`'s dense row height exactly. */
export const Dense: Story = {
  args: { dense: true },
};

/** `pageSize: 0` turns pagination off — every row renders, no footer. */
export const NoPagination: Story = {
  args: { pageSize: 0 },
};

/** No rows: `emptyMessage` renders as one full-width cell. */
export const Empty: Story = {
  args: { rows: [] },
};

/** `loading` dims the rows and marks the grid busy, without rendering a spinner of its own — that is a consumer's own overlay, composed on top. */
export const Loading: Story = {
  args: { loading: true },
};

const CUSTOM_COLUMNS_WEB: DataGridColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'city', header: 'City' },
  {
    key: 'score',
    header: 'Score',
    sortable: true,
    align: 'end',
    render: (row) => (
      <span className="inline-flex items-center gap-1 tabular-nums">
        {row.score}
        {row.score >= 90 ? <span aria-hidden="true">🏅</span> : null}
      </span>
    ),
  },
];

const CUSTOM_COLUMNS_NATIVE: DataGridColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'city', header: 'City' },
  {
    key: 'score',
    header: 'Score',
    sortable: true,
    align: 'end',
    render: (row) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <InkText>{row.score}</InkText>
        {row.score >= 90 ? <InkText>{' 🏅'}</InkText> : null}
      </View>
    ),
  },
];

/**
 * A `render`ed column — here, a medal glyph appended to the top scorers.
 * `render` wins over the raw row value on both leaves, and each leaf gets its
 * own column array because a `render` result is inserted straight into that
 * leaf's own tree: a `<span>` for the web pane, RN `View`/`Text` for the
 * native one.
 */
export const CustomCells: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={480}
      web={
        <DataGridWeb
          columns={CUSTOM_COLUMNS_WEB}
          rows={args.rows}
          selectable={args.selectable}
          pageSize={args.pageSize}
          dense={args.dense}
          striped={args.striped}
          caption={args.caption}
          emptyMessage={args.emptyMessage}
          loading={args.loading}
          onSortChange={args.onSortChange}
          onSelectedChange={args.onSelectedChange}
          onPageChange={args.onPageChange}
        />
      }
      native={
        <DataGridNative
          columns={CUSTOM_COLUMNS_NATIVE}
          rows={args.rows}
          selectable={args.selectable}
          pageSize={args.pageSize}
          dense={args.dense}
          striped={args.striped}
          caption={args.caption}
          emptyMessage={args.emptyMessage}
          loading={args.loading}
          onSortChange={args.onSortChange}
          onSelectedChange={args.onSelectedChange}
          onPageChange={args.onPageChange}
        />
      }
    />
  ),
};
