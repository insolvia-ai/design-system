import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Dropdown as DropdownWeb } from '@design-system/dropdown/dropdown.web.tsx';
import { Dropdown as DropdownNative } from '@design-system/dropdown/dropdown.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

type DropdownArgs = {
  trigger: string;
  groupLabel: string;
  onSelect: (item: string) => void;
};

/**
 * A menu of commands, following the APG menu-button pattern.
 *
 * THE KEYBOARD IS THE DIVERGENCE. On web the items take REAL focus, one at a
 * time, through a roving tabindex: opening moves focus into the menu, the
 * arrows walk it, Escape closes and hands focus back to the trigger. That is
 * what the pattern specifies, and it is why `dropdown.props.ts` deliberately
 * keeps the grammar OUT of the shared module — the DOM already holds the item
 * order, and a second copy in a registry would be a chance to disagree with
 * what is on screen.
 *
 * The native leaf has no focus to rove and no arrow keys to rove with, so it
 * is driven by press. Both leaves agree on the roles (`menu`, `menuitem`,
 * `separator`), on the 44px item height, and on a disabled item staying
 * present rather than disappearing — `aria-disabled`, not removal, so its
 * existence is still discoverable.
 */
const meta = {
  title: 'Overlays/Dropdown',
  parameters: { layout: 'fullscreen' },
  args: {
    trigger: 'Actions',
    groupLabel: 'Ship',
    onSelect: fn(),
  },
  argTypes: {
    trigger: { control: 'text' },
    groupLabel: { control: 'text' },
    onSelect: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Tab to the web trigger and press ArrowDown: focus moves INTO the menu. The native pane is press-driven — see the doc comment."
      web={
        <DropdownWeb.Root>
          <DropdownWeb.Trigger>{args.trigger}</DropdownWeb.Trigger>
          <DropdownWeb.Content>
            <DropdownWeb.Label>{args.groupLabel}</DropdownWeb.Label>
            <DropdownWeb.Item onSelect={() => args.onSelect('Rename')}>Rename</DropdownWeb.Item>
            <DropdownWeb.Item onSelect={() => args.onSelect('Duplicate')}>
              Duplicate
            </DropdownWeb.Item>
            <DropdownWeb.Divider />
            <DropdownWeb.Item disabled>Scuttle</DropdownWeb.Item>
          </DropdownWeb.Content>
        </DropdownWeb.Root>
      }
      native={
        <DropdownNative.Root>
          <DropdownNative.Trigger>{args.trigger}</DropdownNative.Trigger>
          <DropdownNative.Content>
            <DropdownNative.Label>{args.groupLabel}</DropdownNative.Label>
            <DropdownNative.Item onSelect={() => args.onSelect('Rename')}>
              Rename
            </DropdownNative.Item>
            <DropdownNative.Item onSelect={() => args.onSelect('Duplicate')}>
              Duplicate
            </DropdownNative.Item>
            <DropdownNative.Divider />
            <DropdownNative.Item disabled>Scuttle</DropdownNative.Item>
          </DropdownNative.Content>
        </DropdownNative.Root>
      }
    />
  ),
} satisfies Meta<DropdownArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends with both menus OPEN, so axe audits the surface rather than a lone
 * trigger. Both panes drive the same `onSelect`, so the play counts calls per
 * pane.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: opening moves focus into the menu', async () => {
      await userEvent.click(web.getByRole('button', { name: args.trigger }));
      await expect(web.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
      await expect(web.getByRole('menu')).toHaveAccessibleName(args.trigger);
    });

    await step('web leaf: the arrows walk the items and clamp at the end', async () => {
      await userEvent.keyboard('{ArrowDown}');
      await expect(web.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
      // 'Scuttle' is aria-disabled, so the walk stops here rather than
      // wrapping — the same clamp Select's `stepEnabled` uses.
      await userEvent.keyboard('{ArrowDown}');
      await expect(web.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
    });

    await step('web leaf: choosing runs the handler and closes', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(args.onSelect).toHaveBeenCalledTimes(1);
      await expect(args.onSelect).toHaveBeenLastCalledWith('Duplicate');
    });

    await step('native leaf: press-driven, same handler', async () => {
      await userEvent.click(native.getByRole('button', { name: args.trigger }));
      await userEvent.click(native.getByRole('menuitem', { name: 'Rename' }));
      await expect(args.onSelect).toHaveBeenCalledTimes(2);
      await expect(args.onSelect).toHaveBeenLastCalledWith('Rename');
    });

    await step('leave both menus open for the a11y pass — native FIRST', async () => {
      // The order matters. The web leaf dismisses on a DOCUMENT-level
      // pointerdown, and the other pane is part of that document, so opening
      // the native menu second would close the web one behind it. The native
      // leaf has no outside dismissal to fire, so opening it first is safe —
      // which is itself the divergence this story is about, showing up as a
      // constraint on the play.
      await userEvent.click(native.getByRole('button', { name: args.trigger }));
      await userEvent.click(web.getByRole('button', { name: args.trigger }));
      await expect(web.getByRole('menu')).toBeInTheDocument();
      await expect(native.getByRole('menu')).toBeInTheDocument();
    });
  },
};
