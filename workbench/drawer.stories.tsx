// Drawer's panel is a PORTALED overlay: the web leaf renders into
// document.body and the native leaf into an RN Modal, so neither ends up
// inside its `<LeafPair>` pane. Queries here therefore go through `screen`
// rather than `pair()` — and only ONE leaf is opened at a time, because two
// open modals fight over focus and `aria-hidden`. Every play ends with both
// closed. dialog.stories.tsx's header has the full reasoning; this file
// follows it.
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test';

import { Drawer as DrawerWeb } from '@design-system/drawer/drawer.web.tsx';
import { Drawer as DrawerNative } from '@design-system/drawer/drawer.native.tsx';
import type { DrawerSide } from '@design-system/drawer/drawer.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const SIDES = ['left', 'right', 'top', 'bottom'] as const satisfies readonly DrawerSide[];

type DrawerArgs = {
  side: DrawerSide;
  trigger: string;
  title: string;
  description: string;
  closeLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * A modal dialog that enters from an edge.
 *
 * It IS the Dialog — same state machine, same id scheme, same dismissal
 * contract (Escape, backdrop press, focus trap, focus return, scroll lock) —
 * with one thing changed: where the panel sits. That is why `drawer.props.ts`
 * reuses `useDialogState` verbatim rather than restating it, exactly as
 * AlertDialog does.
 *
 * The two leaves get there differently. The web leaf portals a `role="dialog"`
 * panel into `document.body` and hand-rolls the trap; the native leaf hands
 * the whole problem to RN's `Modal`, which supplies hosting, focus containment
 * and hardware dismissal (the Android back button, which react-native-web maps
 * to Escape). `Drawer.Backdrop` renders nothing on native for that reason —
 * the Modal owns the scrim — and exists only so one piece of JSX composes on
 * both platforms.
 */
const meta = {
  title: 'Overlays/Drawer',
  parameters: { layout: 'fullscreen' },
  args: {
    side: 'right',
    trigger: 'Open filters',
    title: 'Filters',
    description: 'Narrow the fleet list to ships you can actually book.',
    closeLabel: 'Done',
    onOpenChange: fn(),
  },
  argTypes: {
    side: { control: 'inline-radio', options: [...SIDES] },
    trigger: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    closeLabel: { control: 'text' },
    onOpenChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Open one pane at a time — two modals at once fight over focus. Each panel covers the whole window, not its pane."
      web={
        <DrawerWeb.Root side={args.side} onOpenChange={args.onOpenChange}>
          <DrawerWeb.Trigger>{args.trigger}</DrawerWeb.Trigger>
          <DrawerWeb.Backdrop />
          <DrawerWeb.Panel>
            <DrawerWeb.Title>{args.title}</DrawerWeb.Title>
            <DrawerWeb.Description>{args.description}</DrawerWeb.Description>
            <DrawerWeb.Close>{args.closeLabel}</DrawerWeb.Close>
          </DrawerWeb.Panel>
        </DrawerWeb.Root>
      }
      native={
        <DrawerNative.Root side={args.side} onOpenChange={args.onOpenChange}>
          <DrawerNative.Trigger>{args.trigger}</DrawerNative.Trigger>
          <DrawerNative.Backdrop />
          <DrawerNative.Panel>
            <DrawerNative.Title>{args.title}</DrawerNative.Title>
            <DrawerNative.Description>{args.description}</DrawerNative.Description>
            <InkText style={{ fontSize: 13 }}>Same panel, entered from the same edge.</InkText>
            <DrawerNative.Close>{args.closeLabel}</DrawerNative.Close>
          </DrawerNative.Panel>
        </DrawerNative.Root>
      }
    />
  ),
} satisfies Meta<DrawerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One leaf at a time, and both closed at the end — the rule every portaled
 * overlay in this workbench follows.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: opens as a modal dialog, named and described', async () => {
      await userEvent.click(web.getByRole('button', { name: args.trigger }));
      const panel = await screen.findByRole('dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAccessibleName(args.title);
      await expect(panel).toHaveAccessibleDescription(args.description);
      await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    });

    await step('web leaf: Escape closes it and focus returns to the opener', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await expect(web.getByRole('button', { name: args.trigger })).toHaveFocus();
    });

    await step('native leaf: opens through RN’s Modal, named by its Title', async () => {
      await userEvent.click(native.getByRole('button', { name: args.trigger }));
      const panel = await screen.findByRole('dialog');
      await expect(panel).toHaveAccessibleName(args.title);
    });

    await step('native leaf: the Close part shuts it', async () => {
      await userEvent.click(screen.getByRole('button', { name: args.closeLabel }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  },
};

/**
 * The four edges. `side` is on the Root, so every panel under it agrees;
 * `Drawer.Panel` can override it, which is rarely what you want.
 */
export const Sides: Story = {
  argTypes: { side: { control: 'inline-radio', options: [...SIDES] } },
  args: { side: 'bottom' },
};
