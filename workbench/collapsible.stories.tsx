import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { Collapsible as CollapsibleWeb } from '@design-system/collapsible/collapsible.web.tsx';
import { Collapsible as CollapsibleNative } from '@design-system/collapsible/collapsible.native.tsx';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';
import { Input as InputWeb } from '@design-system/input/input.web.tsx';
import { Input as InputNative } from '@design-system/input/input.native.tsx';

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
 * Both panels accept arbitrary children as of 0.15.0 — the native leaf wraps a
 * bare string so prose keeps the panel's muted colour, and passes anything
 * else straight through. The `panel` arg stays a string because these stories
 * are about the disclosure's WIRING and a string is the least distracting
 * payload for that; `PanelHoldsAControl` below is where the container half of
 * the contract is shown.
 */
type CollapsibleArgs = {
  trigger: string;
  panel: string;
  defaultOpen: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta = {
  title: 'Data display/Collapsible',
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
      note="A string payload keeps these stories about the disclosure's wiring. Both panels take elements too — see “Panel holds a control”."
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
 * PERMANENT REGRESSION STORY (0.15.0). A panel holding a form control rather
 * than prose — the same one `accordion.stories.tsx` carries, and for the same
 * reason: until 0.15.0 the native panel force-wrapped every child in a `Text`,
 * whose react-native-web output carries `display: inline` and sets the
 * text-ancestor context. The field's layout collapsed into inline flow and its
 * label came out as a `<span>` inheriting the panel's muted colour.
 *
 * Both panes must lay the field out identically, with the label in ink. That
 * is a difference no jsdom assertion can see — keep this story after the bug
 * feels ancient.
 */
export const PanelHoldsAControl: Story = {
  name: 'Panel holds a control',
  args: { defaultOpen: true, trigger: 'Show berth assignment' },
  render: (args) => (
    <LeafPair
      note="A panel is a container, not a paragraph. Both panes should lay the field out identically, with the label in ink rather than the panel's muted colour."
      web={
        <CollapsibleWeb.Root defaultOpen={args.defaultOpen} onOpenChange={args.onOpenChange}>
          <CollapsibleWeb.Trigger>{args.trigger}</CollapsibleWeb.Trigger>
          <CollapsibleWeb.Panel>
            <FieldWeb.Root name="berth-web">
              <FieldWeb.Label>Docking bay</FieldWeb.Label>
              <InputWeb placeholder="94" />
            </FieldWeb.Root>
          </CollapsibleWeb.Panel>
        </CollapsibleWeb.Root>
      }
      native={
        <CollapsibleNative.Root defaultOpen={args.defaultOpen} onOpenChange={args.onOpenChange}>
          <CollapsibleNative.Trigger>{args.trigger}</CollapsibleNative.Trigger>
          <CollapsibleNative.Panel>
            <FieldNative.Root name="berth-native">
              <FieldNative.Label>Docking bay</FieldNative.Label>
              <InputNative placeholder="94" />
            </FieldNative.Root>
          </CollapsibleNative.Panel>
        </CollapsibleNative.Root>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { web, native } = pair(canvasElement);

    // Typing is the proof that matters: a control the panel had turned into
    // inline text would still be FOUND by role, but it would not accept input
    // as its own labelled field. Ends open, so axe audits the disclosed state.
    await step('web leaf: the field inside the panel takes input', async () => {
      const box = web.getByRole('textbox', { name: 'Docking bay' });
      await userEvent.type(box, '327');
      await expect(box).toHaveValue('327');
    });

    await step('native leaf: same field, same input', async () => {
      const box = native.getByRole('textbox', { name: 'Docking bay' });
      await userEvent.type(box, '327');
      await expect(box).toHaveValue('327');
    });
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
