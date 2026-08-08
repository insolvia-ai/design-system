import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent } from 'storybook/test';

import { Tooltip as TooltipWeb } from '@design-system/tooltip/tooltip.web.tsx';
import { Tooltip as TooltipNative } from '@design-system/tooltip/tooltip.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

type TooltipArgs = {
  trigger: string;
  content: string;
};

/**
 * A short explanation attached to a control.
 *
 * THE GESTURE IS THE DIVERGENCE, and it is deliberate. On web a tooltip
 * appears on hover AND on focus — the focus half is the only way a keyboard
 * user ever sees one — and dismisses on Escape, which WCAG 1.4.13 requires of
 * anything that appears on hover. On a touch screen neither gesture exists, so
 * the native leaf uses a long press, the platform's own "tell me more".
 *
 * In this workbench both panes respond to hover, because react-native-web
 * gives the native leaf a real pointer in a browser. On a device it is the
 * long press.
 *
 * What does NOT diverge is the association: both leaves point the trigger at
 * the bubble with `aria-describedby`, and only while the bubble exists.
 */
const meta = {
  title: 'Overlays/Tooltip',
  parameters: { layout: 'fullscreen' },
  args: {
    trigger: 'Jump drive',
    content: 'Charges for 30 seconds before engaging.',
  },
  argTypes: {
    trigger: { control: 'text' },
    content: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      note="Hover either pane. On a real device the native pane needs a long press instead — see the doc comment."
      web={
        <TooltipWeb.Root>
          <TooltipWeb.Trigger>{args.trigger}</TooltipWeb.Trigger>
          <TooltipWeb.Content>{args.content}</TooltipWeb.Content>
        </TooltipWeb.Root>
      }
      native={
        <TooltipNative.Root>
          <TooltipNative.Trigger aria-label={args.trigger}>{args.trigger}</TooltipNative.Trigger>
          <TooltipNative.Content>{args.content}</TooltipNative.Content>
        </TooltipNative.Root>
      }
    />
  ),
} satisfies Meta<TooltipArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends with BOTH bubbles showing, because axe runs after the play — a tooltip
 * that closed itself at the end of the play would never be audited.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: hover shows the bubble and describes the trigger', async () => {
      const trigger = web.getByRole('button', { name: args.trigger });
      await expect(trigger).not.toHaveAttribute('aria-describedby');
      await userEvent.hover(trigger);
      const bubble = web.getByRole('tooltip');
      await expect(trigger).toHaveAttribute('aria-describedby', bubble.id);
      await expect(trigger).toHaveAccessibleDescription(args.content);
    });

    await step('native leaf: same association, through react-native-web', async () => {
      const trigger = native.getByRole('button', { name: args.trigger });
      await userEvent.hover(trigger);
      const bubble = native.getByRole('tooltip');
      await expect(trigger).toHaveAttribute('aria-describedby', bubble.id);
    });
  },
};

/**
 * Forced open, so the bubble can be inspected without holding a pointer still.
 * `open` is the controlled prop; leave it off and the gesture drives it.
 */
export const AlwaysOpen: Story = {
  render: (args) => (
    <LeafPair
      web={
        <TooltipWeb.Root open>
          <TooltipWeb.Trigger>{args.trigger}</TooltipWeb.Trigger>
          <TooltipWeb.Content>{args.content}</TooltipWeb.Content>
        </TooltipWeb.Root>
      }
      native={
        <TooltipNative.Root open>
          <TooltipNative.Trigger aria-label={args.trigger}>{args.trigger}</TooltipNative.Trigger>
          <TooltipNative.Content>{args.content}</TooltipNative.Content>
        </TooltipNative.Root>
      }
    />
  ),
};
