import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { View } from 'react-native';

import { Toggle as ToggleWeb } from '@design-system/toggle/toggle.web.tsx';
import { Toggle as ToggleNative } from '@design-system/toggle/toggle.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * `Toggle` is a single component on both leaves, so — unlike Checkbox and
 * Switch — meta gets a `component` for the docs-page props table. A
 * standalone toggle takes its accessible name from its text children on both
 * leaves (see `States` below), so args carry that text as `children` rather
 * than a separate `label`. `defaultPressed` gets no control — it seeds
 * UNCONTROLLED state (the select.stories.tsx `defaultValue` note explains
 * the same gap).
 */
type ToggleArgs = {
  children: string;
  defaultPressed: boolean;
  disabled: boolean;
  onPressedChange: (pressed: boolean) => void;
};

const meta = {
  title: 'Forms/Toggle',
  component: ToggleWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    children: 'Bold',
    defaultPressed: false,
    disabled: false,
    onPressedChange: fn(),
  },
  argTypes: {
    defaultPressed: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <ToggleWeb
          defaultPressed={args.defaultPressed}
          disabled={args.disabled}
          onPressedChange={args.onPressedChange}
        >
          {args.children}
        </ToggleWeb>
      }
      native={
        <ToggleNative
          defaultPressed={args.defaultPressed}
          disabled={args.disabled}
          onPressedChange={args.onPressedChange}
        >
          {args.children}
        </ToggleNative>
      }
    />
  ),
} satisfies Meta<ToggleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play starts pressed (so the
 * sequence ends there too — a pressed toggle is the more interesting state
 * for the axe pass that follows), unpresses on the first click, and
 * re-presses on the second, asserting `aria-pressed` and the shared
 * `onPressedChange` arg at every step.
 */
export const Basic: Story = {
  args: { defaultPressed: true },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: click unpresses, click again re-presses', async () => {
      const toggle = web.getByRole('button', { name: args.children });
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(1);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(2);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(true);
    });

    await step('native leaf: same pressed contract, same handler', async () => {
      const toggle = native.getByRole('button', { name: args.children });
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(3);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(4);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(true);
    });
  },
};

/**
 * A standalone `Toggle` — no enclosing `ToggleGroup` — takes its accessible
 * name from its text children on both leaves, so every toggle below is given
 * one directly (a document editor's formatting buttons: "Bold", "Italic").
 * The native leaf renders that text as a `Pressable` + `<Text>` under
 * `accessibilityRole="button"`, not the RN `'togglebutton'` role — see
 * `toggle.native.tsx`'s header for why that role would drop the computed
 * name on react-native-web.
 */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 12 }}>
          <ToggleWeb>Bold</ToggleWeb>
          <ToggleWeb defaultPressed>Italic</ToggleWeb>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ToggleNative>Bold</ToggleNative>
          <ToggleNative defaultPressed>Italic</ToggleNative>
        </View>
      }
    />
  ),
};

/**
 * Disabled is asserted, not clicked: the web leaf disables the real
 * `<button>` (jest-dom's `toBeDisabled`), the native leaf can only speak
 * ARIA through react-native-web (`aria-disabled`).
 */
export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<ToggleWeb disabled>Strikethrough</ToggleWeb>}
      native={<ToggleNative disabled>Strikethrough</ToggleNative>}
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('button', { name: 'Strikethrough' })).toBeDisabled();
    await expect(native.getByRole('button', { name: 'Strikethrough' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
