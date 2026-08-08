import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Text, View } from 'react-native';

import { Switch as SwitchWeb } from '@design-system/switch/switch.web.tsx';
import { Switch as SwitchNative } from '@design-system/switch/switch.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

/**
 * `Switch` is a parts object (`Root`/`Thumb`), not a single component — so
 * unlike Toggle there is no meta `component` for the docs-page props table.
 * Args cover the on/off surface plus the `label` rendered beside it (see the
 * accessible-name note on `States` below for why every switch here carries
 * one). `defaultChecked` gets no control — it seeds UNCONTROLLED state (the
 * select.stories.tsx `defaultValue` note explains the same gap).
 */
type SwitchArgs = {
  label: string;
  defaultChecked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const meta = {
  title: 'Forms/Switch',
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Email me mission updates',
    defaultChecked: false,
    disabled: false,
    onCheckedChange: fn(),
  },
  argTypes: {
    defaultChecked: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <LabelledWeb
          label={args.label}
          defaultChecked={args.defaultChecked}
          disabled={args.disabled}
          onCheckedChange={args.onCheckedChange}
        />
      }
      native={
        <LabelledNative
          label={args.label}
          defaultChecked={args.defaultChecked}
          disabled={args.disabled}
          onCheckedChange={args.onCheckedChange}
        />
      }
    />
  ),
} satisfies Meta<SwitchArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play starts checked (so the
 * sequence ends there too — a checked switch is the more interesting state
 * for the axe pass that follows), unchecks on the first click, and
 * re-checks on the second, asserting `aria-checked` and the shared
 * `onCheckedChange` arg at every step.
 */
export const Basic: Story = {
  args: { defaultChecked: true },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: click unchecks, click again re-checks', async () => {
      const toggle = web.getByRole('switch', { name: args.label });
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(1);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });

    await step('native leaf: same checked contract, same handler', async () => {
      const toggle = native.getByRole('switch', { name: args.label });
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(4);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });
  },
};

/**
 * `Switch.Root` renders only the track and thumb — no text — so it fails
 * `aria-toggle-field-name` without a name, the same gap `Checkbox.Root` and
 * `RadioGroup.Item` have. Same fix: `aria-label`/`accessibilityLabel` on
 * Root, matched by visible text beside it.
 */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LabelledWeb label="Email me mission updates" />
          <LabelledWeb label="Transmit hyperspace alerts" defaultChecked />
        </div>
      }
      native={
        <View style={{ gap: 16 }}>
          <LabelledNative label="Email me mission updates" />
          <LabelledNative label="Transmit hyperspace alerts" defaultChecked />
        </View>
      }
    />
  ),
};

/**
 * Disabled is asserted, not clicked: the web Root is a real disabled
 * `<button>` (jest-dom's `toBeDisabled`), the native Root can only speak
 * ARIA through react-native-web (`aria-disabled`).
 */
export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={
        <LabelledWeb label="Holonet statements (required by the fleet)" disabled defaultChecked />
      }
      native={
        <LabelledNative
          label="Holonet statements (required by the fleet)"
          disabled
          defaultChecked
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(
      web.getByRole('switch', { name: 'Holonet statements (required by the fleet)' }),
    ).toBeDisabled();
    await expect(
      native.getByRole('switch', { name: 'Holonet statements (required by the fleet)' }),
    ).toHaveAttribute('aria-disabled', 'true');
  },
};

function LabelledWeb({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof SwitchWeb.Root>>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SwitchWeb.Root aria-label={label} {...props}>
        <SwitchWeb.Thumb />
      </SwitchWeb.Root>
      <span>{label}</span>
    </div>
  );
}

function LabelledNative({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof SwitchNative.Root>>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <SwitchNative.Root accessibilityLabel={label} {...props}>
        <SwitchNative.Thumb />
      </SwitchNative.Root>
      <InkText>{label}</InkText>
    </View>
  );
}
