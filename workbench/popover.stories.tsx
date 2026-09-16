import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

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

/**
 * `openOnHover`: the popover opens when the pointer rests on the trigger, or
 * when focus lands on it — the focus half is what keeps a hover surface
 * reachable by keyboard (WCAG 1.4.13) — and closes once BOTH the pointer and
 * focus have left the trigger and the surface together. Crossing from the
 * trigger into the surface is not a leave; a short grace period covers the
 * gap between them. A press opens it and does not close it, so a touch
 * screen, whose tap arrives as a hover first, is not cancelled by itself.
 *
 * In this workbench both panes answer the pointer, because react-native-web
 * gives the native leaf one. On a device the native pane opens by press.
 *
 * Ends with the WEB surface open. Both cannot end open here: the pointer
 * can only rest on one trigger, and leaving the other closes it — which is
 * the behaviour under test. The native surface's markup is audited by `Basic`.
 */
export const OpenOnHover: Story = {
  args: {
    trigger: 'Jump drive',
    title: 'Jump drive',
    body: 'Charges for 30 seconds before engaging. Rated for this route.',
    closeLabel: 'Got it',
  },
  render: (args) => (
    <LeafPair
      note="Rest the pointer on either trigger, or Tab to it. Move into the card and it stays; leave both and it goes."
      web={
        <PopoverWeb.Root openOnHover onOpenChange={args.onOpenChange}>
          <PopoverWeb.Trigger>{args.trigger}</PopoverWeb.Trigger>
          <PopoverWeb.Content>
            <PopoverWeb.Title>{args.title}</PopoverWeb.Title>
            <p style={{ fontSize: 14, margin: 0 }}>{args.body}</p>
            <PopoverWeb.Close>{args.closeLabel}</PopoverWeb.Close>
          </PopoverWeb.Content>
        </PopoverWeb.Root>
      }
      native={
        <PopoverNative.Root openOnHover onOpenChange={args.onOpenChange}>
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
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('native leaf: hover opens, leaving closes after the grace period', async () => {
      const trigger = native.getByRole('button', { name: args.trigger });
      await userEvent.hover(trigger);
      await expect(native.getByRole('dialog')).toHaveAccessibleName(args.title);
      await userEvent.unhover(trigger);
      await waitFor(() => expect(native.queryByRole('dialog')).not.toBeInTheDocument());
    });

    await step('web leaf: hover opens it, and a press does not close it', async () => {
      // Focus-opens is asserted in popover.test.tsx, not here: a headless
      // window that does not itself hold focus updates `activeElement` on
      // `.focus()` without dispatching the focus event React listens for.
      const trigger = web.getByRole('button', { name: args.trigger });
      await userEvent.hover(trigger);
      await expect(web.getByRole('dialog')).toHaveAccessibleName(args.title);
      await userEvent.click(trigger);
      await expect(web.getByRole('dialog')).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};
