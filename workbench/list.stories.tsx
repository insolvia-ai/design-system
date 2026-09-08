import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { List as ListWeb } from '@design-system/list/list.web.tsx';
import { List as ListNative } from '@design-system/list/list.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText, MutedText } from './ink-text.tsx';

/**
 * A vertical list of rows — `Root`/`Item`/`Leading`/`Trailing`/`Text`/
 * `Subheader`/`Divider`, the same split Material UI draws across
 * `List`/`ListItem`/`ListItemButton`/`ListItemIcon`/`ListItemText`/
 * `ListSubheader`. A row is a real `<button>` when it takes `onClick`
 * (`onPress` on native), a real `<a>` when it takes `href`, and a plain,
 * non-interactive row otherwise — compare the first row in `Basic` (pressable)
 * against the rest (not).
 */
type ListArgs = {
  dense: boolean;
  inset: boolean;
  onPress: () => void;
};

const meta = {
  title: 'Data display/List',
  parameters: { layout: 'fullscreen' },
  args: {
    dense: false,
    inset: false,
    onPress: fn(),
  },
  argTypes: {
    dense: { control: 'boolean' },
    inset: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      web={<SettingsListWeb dense={args.dense} inset={args.inset} onPress={args.onPress} />}
      native={<SettingsListNative dense={args.dense} inset={args.inset} onPress={args.onPress} />}
    />
  ),
} satisfies Meta<ListArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Four rows: a leading glyph, a primary/secondary text pair, and a trailing
 * chevron on each. The second row is `selected`. Only the FIRST row is
 * pressable — it carries the shared `onPress` arg — so the play drives that
 * one row in each pane and asserts the call count; the rest demonstrate the
 * plain, non-interactive `<li>`/`View` rendering `Static` covers on its own.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: the pressable row fires the handler', async () => {
      await userEvent.click(web.getByRole('button', { name: /Notifications/ }));
      await expect(args.onPress).toHaveBeenCalledTimes(1);
    });

    await step('native leaf: the same row fires it again', async () => {
      await userEvent.click(native.getByRole('button', { name: /Notifications/ }));
      await expect(args.onPress).toHaveBeenCalledTimes(2);
    });
  },
};

/** Rows at 40px instead of the default 48px — everything else unchanged. */
export const Dense: Story = {
  args: { dense: true },
};

/**
 * `inset` on `Root` pads every row with `pl-xl` instead of `px-md`, so a
 * Leading-less row still lines up under an icon row elsewhere in the list —
 * the second row here has no `Leading` and starts at the same x as the first
 * row's text.
 */
export const Inset: Story = {
  args: { inset: true },
  render: (args) => (
    <LeafPair
      note="The second row has no Leading icon and still lines up with the first row's text, because Root is `inset`."
      web={
        <ListWeb.Root inset={args.inset}>
          <ListWeb.Item onClick={args.onPress}>
            <ListWeb.Leading>🔔</ListWeb.Leading>
            <ListWeb.Text primary="Notifications" />
          </ListWeb.Item>
          <ListWeb.Item>
            <ListWeb.Text primary="No leading icon, still aligned" />
          </ListWeb.Item>
        </ListWeb.Root>
      }
      native={
        <ListNative.Root inset={args.inset}>
          <ListNative.Item onPress={args.onPress}>
            <ListNative.Leading>🔔</ListNative.Leading>
            <ListNative.Text primary="Notifications" />
          </ListNative.Item>
          <ListNative.Item>
            <ListNative.Text primary="No leading icon, still aligned" />
          </ListNative.Item>
        </ListNative.Root>
      }
    />
  ),
};

/**
 * Two groups under their own `Subheader`, split by a `Divider` — the
 * `List.Subheader` row and the `List.Divider` row, each a plain `<li>` (no
 * button, no anchor) sitting between pressable rows.
 */
export const Subheaders: Story = {
  render: (args) => (
    <LeafPair
      web={
        <ListWeb.Root>
          <ListWeb.Subheader>Recent</ListWeb.Subheader>
          <ListWeb.Item onClick={args.onPress}>
            <ListWeb.Text primary="Q3 budget review" secondary="Edited 2h ago" />
          </ListWeb.Item>
          <ListWeb.Item>
            <ListWeb.Text primary="Design system audit" secondary="Edited yesterday" />
          </ListWeb.Item>
          <ListWeb.Divider />
          <ListWeb.Subheader>Archived</ListWeb.Subheader>
          <ListWeb.Item>
            <ListWeb.Text primary="2023 roadmap" secondary="Edited last year" />
          </ListWeb.Item>
        </ListWeb.Root>
      }
      native={
        <ListNative.Root>
          <ListNative.Subheader>Recent</ListNative.Subheader>
          <ListNative.Item onPress={args.onPress}>
            <ListNative.Text primary="Q3 budget review" secondary="Edited 2h ago" />
          </ListNative.Item>
          <ListNative.Item>
            <ListNative.Text primary="Design system audit" secondary="Edited yesterday" />
          </ListNative.Item>
          <ListNative.Divider />
          <ListNative.Subheader>Archived</ListNative.Subheader>
          <ListNative.Item>
            <ListNative.Text primary="2023 roadmap" secondary="Edited last year" />
          </ListNative.Item>
        </ListNative.Root>
      }
    />
  ),
};

/**
 * No `onClick`/`onPress`/`href` anywhere — every row is a plain `<li>`/`View`,
 * for read-only content like a receipt or a summary rather than navigation.
 */
export const Static: Story = {
  render: () => (
    <LeafPair
      note="Every row here is a plain, non-interactive listitem — compare against Basic's first row, which is a real button."
      web={
        <ListWeb.Root>
          <ListWeb.Item>
            <ListWeb.Text primary="Subtotal" secondary="3 items" />
            <ListWeb.Trailing className="text-ink">$42.00</ListWeb.Trailing>
          </ListWeb.Item>
          <ListWeb.Item>
            <ListWeb.Text primary="Shipping" />
            <ListWeb.Trailing className="text-ink">$4.99</ListWeb.Trailing>
          </ListWeb.Item>
          <ListWeb.Item>
            <ListWeb.Text primary="Total" />
            <ListWeb.Trailing className="font-medium text-ink">$46.99</ListWeb.Trailing>
          </ListWeb.Item>
        </ListWeb.Root>
      }
      native={
        <ListNative.Root>
          <ListNative.Item>
            <ListNative.Text primary="Subtotal" secondary="3 items" />
            <ListNative.Trailing>
              <InkText>$42.00</InkText>
            </ListNative.Trailing>
          </ListNative.Item>
          <ListNative.Item>
            <ListNative.Text primary="Shipping" />
            <ListNative.Trailing>
              <InkText>$4.99</InkText>
            </ListNative.Trailing>
          </ListNative.Item>
          <ListNative.Item>
            <ListNative.Text primary="Total" />
            <ListNative.Trailing>
              <InkText style={{ fontWeight: '600' }}>$46.99</InkText>
            </ListNative.Trailing>
          </ListNative.Item>
        </ListNative.Root>
      }
    />
  ),
};

interface SettingsListProps {
  dense: boolean;
  inset: boolean;
  onPress: () => void;
}

const ROWS = [
  { glyph: '🔔', primary: 'Notifications', secondary: 'Push and email' },
  { glyph: '📁', primary: 'Projects', secondary: '12 active' },
  { glyph: '⚙', primary: 'Settings', secondary: 'Account, billing' },
  { glyph: '🔒', primary: 'Security', secondary: '2FA enabled' },
] as const;

function SettingsListWeb({ dense, inset, onPress }: SettingsListProps) {
  return (
    <ListWeb.Root dense={dense} inset={inset}>
      {ROWS.map((row, index) => (
        <ListWeb.Item
          key={row.primary}
          // Only the first row is pressable — see the Basic story's JSDoc.
          onClick={index === 0 ? onPress : undefined}
          selected={index === 1}
        >
          <ListWeb.Leading>{row.glyph}</ListWeb.Leading>
          <ListWeb.Text primary={row.primary} secondary={row.secondary} />
          <ListWeb.Trailing aria-hidden="true" className="text-muted">
            ›
          </ListWeb.Trailing>
        </ListWeb.Item>
      ))}
    </ListWeb.Root>
  );
}

function SettingsListNative({ dense, inset, onPress }: SettingsListProps) {
  return (
    <ListNative.Root dense={dense} inset={inset}>
      {ROWS.map((row, index) => (
        <ListNative.Item
          key={row.primary}
          onPress={index === 0 ? onPress : undefined}
          selected={index === 1}
        >
          <ListNative.Leading>{row.glyph}</ListNative.Leading>
          <ListNative.Text primary={row.primary} secondary={row.secondary} />
          <ListNative.Trailing>
            <MutedText accessible={false}>›</MutedText>
          </ListNative.Trailing>
        </ListNative.Item>
      ))}
    </ListNative.Root>
  );
}
