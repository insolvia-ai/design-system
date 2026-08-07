import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { Collapsible as CollapsibleWeb } from '@design-system/collapsible/collapsible.web.tsx';
import { Collapsible as CollapsibleNative } from '@design-system/collapsible/collapsible.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * Args are typed against the shared surface (`collapsible.props.ts`): both
 * leaves take `onOpenChange` directly, so — unlike Button — no bridging arg
 * name is needed. `defaultOpen` gets no control: it seeds UNCONTROLLED
 * state, so twiddling it after mount would change nothing already on
 * screen, the same reasoning as Select's `defaultValue`. No meta
 * `component` either — `Collapsible` is a parts object (Root/Trigger/Panel),
 * same reason `dialog.stories.tsx` has none.
 *
 * Web `Collapsible.Panel` accepts arbitrary children, the same as any other
 * `<div>`. Native `Collapsible.Panel` wraps its own children in a `<Text>`
 * internally (see `collapsible.native.tsx`), so it takes a plain string, not
 * elements — every story's `panel` arg is a string for that reason, not for
 * brevity.
 */
type CollapsibleArgs = {
  trigger: string;
  panel: string;
  defaultOpen: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta = {
  title: 'Components/Collapsible',
  parameters: { layout: 'fullscreen' },
  args: {
    trigger: 'Show revision history',
    panel: 'Draft created 2 hours ago. 3 edits since.',
    defaultOpen: false,
    disabled: false,
    onOpenChange: fn(),
  },
  argTypes: {
    defaultOpen: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Native `Collapsible.Panel` wraps its children in `<Text>` internally — pass a string, not elements. Every panel here is a plain string for that reason."
      web={
        <CollapsibleWeb.Root
          defaultOpen={args.defaultOpen}
          disabled={args.disabled}
          onOpenChange={args.onOpenChange}
        >
          <CollapsibleWeb.Trigger>{args.trigger}</CollapsibleWeb.Trigger>
          <CollapsibleWeb.Panel>{args.panel}</CollapsibleWeb.Panel>
        </CollapsibleWeb.Root>
      }
      native={
        <CollapsibleNative.Root
          defaultOpen={args.defaultOpen}
          disabled={args.disabled}
          onOpenChange={args.onOpenChange}
        >
          <CollapsibleNative.Trigger>{args.trigger}</CollapsibleNative.Trigger>
          <CollapsibleNative.Panel>{args.panel}</CollapsibleNative.Panel>
        </CollapsibleNative.Root>
      }
    />
  ),
} satisfies Meta<CollapsibleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The play proves the wiring, not the styling: one press per leaf, the
 * shared `onOpenChange` arg must fire for both (call COUNTS, not just
 * `lastCalledWith` — the two panes share one `fn()` arg), and the panel must
 * actually become visible in each — the native leaf MOUNTS it rather than
 * height-animating it, so that assertion is wrapped in `waitFor`.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf fires onOpenChange and reveals the panel', async () => {
      const trigger = web.getByRole('button', { name: args.trigger });
      await userEvent.click(trigger);
      await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(web.getByText(args.panel)).toBeVisible();
    });

    await step('native leaf: same wiring, panel MOUNTS rather than animating open', async () => {
      const trigger = native.getByRole('button', { name: args.trigger });
      await userEvent.click(trigger);
      await expect(args.onOpenChange).toHaveBeenCalledTimes(2);
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await waitFor(() => expect(native.getByText(args.panel)).toBeVisible());
    });
  },
};

export const Open: Story = {
  args: {
    defaultOpen: true,
    trigger: 'Show comments',
    panel: '2 open comments from collaborators.',
  },
};

/**
 * Disabled is asserted, not clicked: the web trigger disables the real
 * `<button>` (jest-dom's `toBeDisabled`), the native trigger can only speak
 * ARIA through react-native-web (`aria-disabled`).
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    trigger: 'Show audit log',
    panel: 'No audit events recorded.',
  },
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('button', { name: args.trigger })).toBeDisabled();
    await expect(native.getByRole('button', { name: args.trigger })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
