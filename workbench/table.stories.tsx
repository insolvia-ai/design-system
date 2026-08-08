import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Table as TableWeb } from '@design-system/table/table.web.tsx';
import { Table as TableNative } from '@design-system/table/table.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const FLEET = [
  { ship: 'Wayfarer', route: 'Ganymede', departs: '09:40' },
  { ship: 'Kestrel', route: 'Europa', departs: '11:15' },
  { ship: 'Lodestar', route: 'Callisto', departs: '14:05' },
  { ship: 'Meridian', route: 'Io', departs: '18:30' },
] as const;

type TableArgs = {
  striped: boolean;
  dense: boolean;
  caption: string;
};

/**
 * Structured data, and the component where the two leaves are LEAST alike
 * under the surface.
 *
 * The web leaf is real `<table>` markup, which carries the whole
 * accessibility contract for free — a screen reader announces "row 3 of 12,
 * column 2, Departure" only because the elements say so. React Native has no
 * table elements at all, so its leaf asserts every one of those roles by hand
 * on a View: `table`, `row`, `columnheader`, `cell`.
 *
 * Be honest about what that buys. A grid of Views with ARIA roles gets most of
 * the way there in a browser and gives a real device nothing to enter a table
 * navigation mode with. For a wide table on native, a list of cards usually
 * serves a user better. This exists so a cross-platform screen CAN render a
 * table, not to claim the two are equivalent.
 *
 * The striping is the other thing worth watching: the web leaf uses
 * `nth-child(even)` and the native leaf an index from the shared module, and
 * the reason the index exists at all is so the two never shade opposite rows.
 */
const meta = {
  title: 'Data display/Table',
  parameters: { layout: 'fullscreen' },
  args: {
    striped: true,
    dense: false,
    caption: 'Departures today',
  },
  argTypes: {
    striped: { control: 'boolean' },
    dense: { control: 'boolean' },
    caption: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={380}
      note="Compare which rows are shaded — the web leaf stripes with CSS, the native leaf with a shared row index. They must pick the same rows."
      web={
        <TableWeb.Root striped={args.striped} dense={args.dense} caption={args.caption}>
          <TableWeb.Head>
            <TableWeb.Row>
              <TableWeb.HeaderCell>Ship</TableWeb.HeaderCell>
              <TableWeb.HeaderCell>Route</TableWeb.HeaderCell>
              <TableWeb.HeaderCell>Departs</TableWeb.HeaderCell>
            </TableWeb.Row>
          </TableWeb.Head>
          <TableWeb.Body>
            {FLEET.map((row) => (
              <TableWeb.Row key={row.ship}>
                <TableWeb.Cell>{row.ship}</TableWeb.Cell>
                <TableWeb.Cell>{row.route}</TableWeb.Cell>
                <TableWeb.Cell>{row.departs}</TableWeb.Cell>
              </TableWeb.Row>
            ))}
          </TableWeb.Body>
          <TableWeb.Foot>
            <TableWeb.Row>
              <TableWeb.Cell>{FLEET.length} ships</TableWeb.Cell>
              <TableWeb.Cell />
              <TableWeb.Cell />
            </TableWeb.Row>
          </TableWeb.Foot>
        </TableWeb.Root>
      }
      native={
        <TableNative.Root striped={args.striped} dense={args.dense} caption={args.caption}>
          <TableNative.Head>
            <TableNative.Row>
              <TableNative.HeaderCell>Ship</TableNative.HeaderCell>
              <TableNative.HeaderCell>Route</TableNative.HeaderCell>
              <TableNative.HeaderCell>Departs</TableNative.HeaderCell>
            </TableNative.Row>
          </TableNative.Head>
          <TableNative.Body>
            {FLEET.map((row) => (
              <TableNative.Row key={row.ship}>
                <TableNative.Cell>{row.ship}</TableNative.Cell>
                <TableNative.Cell>{row.route}</TableNative.Cell>
                <TableNative.Cell>{row.departs}</TableNative.Cell>
              </TableNative.Row>
            ))}
          </TableNative.Body>
          <TableNative.Foot>
            <TableNative.Row>
              <TableNative.Cell>{`${FLEET.length} ships`}</TableNative.Cell>
              <TableNative.Cell> </TableNative.Cell>
              <TableNative.Cell> </TableNative.Cell>
            </TableNative.Row>
          </TableNative.Foot>
        </TableNative.Root>
      }
    />
  ),
} satisfies Meta<TableArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/** Tighter rows for dense data — 36px against the default 48. */
export const Dense: Story = {
  args: { dense: true },
};

/** Unstriped. The default, because a stripe is noise on a narrow table. */
export const Plain: Story = {
  args: { striped: false },
};
