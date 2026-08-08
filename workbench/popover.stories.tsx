import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Popover as PopoverWeb } from '@design-system/popover/popover.web.tsx';
import { Popover as PopoverNative } from '@design-system/popover/popover.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

type PopoverArgs = {
  trigger: string;
  title: string;
  body: string;
  closeLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * A NON-MODAL surface anchored to its trigger — which is the whole reason it
 * exists next to Dialog. It does not trap focus, does not lock scrolling and
 * does not dim the page, so neither leaf sets `aria-modal`: claiming it would
 * tell a screen reader the rest of the page is inert while every control
 * behind it is demonstrably still clickable.
 *
 * ONE CAPABILITY THE WEB PANE HAS AND THE NATIVE PANE DOES NOT: dismissal by
 * pressing outside. The web leaf listens for a document-level `pointerdown`;
 * React Native has no document, and the two ways to catch a press anywhere on
 * screen — a Modal, or a full-screen sibling the component does not own —
 * would each defeat the non-modal point. So a native popover closes from its
 * trigger or from `Popover.Close`, which is why both stories here render a
 * Close. Click outside each pane in turn and the difference is the point.
 */
const meta = {
  title: 'Overlays/Popover',
  parameters: { layout: 'fullscreen' },
  args: {
    trigger: 'Filters',
    title: 'Filter the fleet',
    body: 'Only ships with a jump drive rated for this route.',
    closeLabel: 'Done',
    onOpenChange: fn(),
  },
  argTypes: {
    trigger: { control: 'text' },
    title: { control: 'text' },
    body: { control: 'text' },
    closeLabel: { control: 'text' },
    onOpenChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Press outside each pane: the web popover closes, the native one does not — see the doc comment for why."
      web={
        <PopoverWeb.Root onOpenChange={args.onOpenChange}>
          <PopoverWeb.Trigger>{args.trigger}</PopoverWeb.Trigger>
          <PopoverWeb.Content>
            <PopoverWeb.Title>{args.title}</PopoverWeb.Title>
            <p style={{ fontSize: 14, margin: 0 }}>{args.body}</p>
            <PopoverWeb.Close>{args.closeLabel}</PopoverWeb.Close>
          </PopoverWeb.Content>
        </PopoverWeb.Root>
      }
      native={
        <PopoverNative.Root onOpenChange={args.onOpenChange}>
          <PopoverNative.Trigger>{args.trigger}</PopoverNative.Trigger>
          <PopoverNative.Content>
            <PopoverNative.Title>{args.title}</PopoverNative.Title>
            <InkText style={{ fontSize: 14 }}>{args.body}</InkText>
            <PopoverNative.Close>{args.closeLabel}</PopoverNative.Close>
          </PopoverNative.Content>
        </PopoverNative.Root>
      }
    />
  ),
} satisfies Meta<PopoverArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends with both surfaces OPEN, so axe audits the popover rather than an empty
 * trigger. Both panes drive the same `onOpenChange`, so the play counts calls
 * per pane.
 *
 * THE PANE ORDER HERE IS LOAD-BEARING: native first, web second. The web
 * leaf's outside-press dismissal is a DOCUMENT-level listener, and the other
 * pane is part of that document — so pressing the native trigger while the web
 * popover is open closes the web one, and the play cannot end with both up.
 * Opening the native pane first avoids it, because the native leaf has no
 * outside dismissal to fire. This is not a workbench quirk to route around; it
 * is the divergence the story is about, visible as a test constraint.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('native leaf: opens, and is named by its Title', async () => {
      await userEvent.click(native.getByRole('button', { name: args.trigger }));
      await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
      const surface = native.getByRole('dialog');
      await expect(surface).toHaveAccessibleName(args.title);
      await expect(surface).not.toHaveAttribute('aria-modal');
    });

    await step('web leaf: same — and it stays open, the native one having none', async () => {
      await userEvent.click(web.getByRole('button', { name: args.trigger }));
      await expect(args.onOpenChange).toHaveBeenCalledTimes(2);
      const surface = web.getByRole('dialog');
      await expect(surface).toHaveAccessibleName(args.title);
      await expect(surface).not.toHaveAttribute('aria-modal');
      await expect(native.getByRole('dialog')).toBeInTheDocument();
    });
  },
};
