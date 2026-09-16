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

/**
 * A `Dropdown.Sub` nests a second menu inside the first. THE SHAPE IS THE
 * DIVERGENCE: the web leaf flies out to the right, opening on hover or on
 * ArrowRight/Enter, with ArrowLeft and Escape closing one level; the native
 * leaf unfolds in place beneath its trigger, because a phone has no room
 * beside the menu. Both are a `menuitem` with `aria-haspopup="menu"` and
 * `aria-expanded`, opening a second `menu` labelled by it, and choosing a row
 * at any depth closes the whole tree.
 *
 * Ends with both sub-menus OPEN, so axe audits the nested menus — native
 * first, for the reason `Basic` gives.
 */
export const SubMenus: Story = {
  render: (args) => (
    <LeafPair
      note="Hover 'Move to' in the web pane, or arrow to it and press ArrowRight. Press it in the native pane — it unfolds in place."
      web={
        <DropdownWeb.Root>
          <DropdownWeb.Trigger>{args.trigger}</DropdownWeb.Trigger>
          <DropdownWeb.Content>
            <DropdownWeb.Item onSelect={() => args.onSelect('Rename')}>Rename</DropdownWeb.Item>
            <DropdownWeb.Sub>
              <DropdownWeb.SubTrigger>Move to</DropdownWeb.SubTrigger>
              <DropdownWeb.SubContent>
                <DropdownWeb.Item onSelect={() => args.onSelect('Drydock')}>
                  Drydock
                </DropdownWeb.Item>
                <DropdownWeb.Item onSelect={() => args.onSelect('Orbit')}>Orbit</DropdownWeb.Item>
                <DropdownWeb.Item disabled>Deep space</DropdownWeb.Item>
              </DropdownWeb.SubContent>
            </DropdownWeb.Sub>
            <DropdownWeb.Divider />
            <DropdownWeb.Item onSelect={() => args.onSelect('Duplicate')}>
              Duplicate
            </DropdownWeb.Item>
          </DropdownWeb.Content>
        </DropdownWeb.Root>
      }
      native={
        <DropdownNative.Root>
          <DropdownNative.Trigger>{args.trigger}</DropdownNative.Trigger>
          <DropdownNative.Content>
            <DropdownNative.Item onSelect={() => args.onSelect('Rename')}>
              Rename
            </DropdownNative.Item>
            <DropdownNative.Sub>
              <DropdownNative.SubTrigger>Move to</DropdownNative.SubTrigger>
              <DropdownNative.SubContent>
                <DropdownNative.Item onSelect={() => args.onSelect('Drydock')}>
                  Drydock
                </DropdownNative.Item>
                <DropdownNative.Item onSelect={() => args.onSelect('Orbit')}>
                  Orbit
                </DropdownNative.Item>
                <DropdownNative.Item disabled>Deep space</DropdownNative.Item>
              </DropdownNative.SubContent>
            </DropdownNative.Sub>
            <DropdownNative.Divider />
            <DropdownNative.Item onSelect={() => args.onSelect('Duplicate')}>
              Duplicate
            </DropdownNative.Item>
          </DropdownNative.Content>
        </DropdownNative.Root>
      }
    />
  ),
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('native leaf: the sub trigger unfolds a labelled menu in place', async () => {
      await userEvent.click(native.getByRole('button', { name: args.trigger }));
      const subTrigger = native.getByRole('menuitem', { name: 'Move to' });
      await expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
      await userEvent.click(subTrigger);
      await expect(subTrigger).toHaveAttribute('aria-expanded', 'true');
      await expect(native.getByRole('menu', { name: 'Move to' })).toBeInTheDocument();
    });

    await step('native leaf: a row in the sub-menu closes the whole tree', async () => {
      await userEvent.click(native.getByRole('menuitem', { name: 'Orbit' }));
      await expect(args.onSelect).toHaveBeenCalledTimes(1);
      await expect(args.onSelect).toHaveBeenLastCalledWith('Orbit');
      await expect(native.queryByRole('menu')).not.toBeInTheDocument();
    });

    await step('web leaf: ArrowRight opens the flyout and moves focus into it', async () => {
      await userEvent.click(web.getByRole('button', { name: args.trigger }));
      await userEvent.keyboard('{ArrowDown}');
      await expect(web.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(web.getByRole('menu', { name: 'Move to' })).toBeInTheDocument();
      await expect(web.getByRole('menuitem', { name: 'Drydock' })).toHaveFocus();
    });

    await step('web leaf: the flyout walks on its own; ArrowLeft returns', async () => {
      await userEvent.keyboard('{End}');
      // 'Deep space' is aria-disabled and 'Duplicate' is in the PARENT menu:
      // End stops at the flyout's last enabled row.
      await expect(web.getByRole('menuitem', { name: 'Orbit' })).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(web.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();
      await expect(web.queryByRole('menu', { name: 'Move to' })).not.toBeInTheDocument();
    });

    await step('leave both sub-menus open for the a11y pass', async () => {
      // Web first this time: it is already open, and only the pointer press
      // on the native trigger below could close it — but the native pane is
      // INSIDE the web root's document listener's "outside", so re-open the
      // web flyout last, by keyboard, once the native one is up.
      await userEvent.click(native.getByRole('button', { name: args.trigger }));
      await userEvent.click(native.getByRole('menuitem', { name: 'Move to' }));
      await userEvent.click(web.getByRole('button', { name: args.trigger }));
      await userEvent.keyboard('{ArrowDown}{ArrowRight}');
      await expect(web.getByRole('menu', { name: 'Move to' })).toBeInTheDocument();
      await expect(native.getByRole('menu', { name: 'Move to' })).toBeInTheDocument();
    });
  },
};
