import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Text, View } from 'react-native';

import { Checkbox as CheckboxWeb } from '@design-system/checkbox/checkbox.web.tsx';
import { Checkbox as CheckboxNative } from '@design-system/checkbox/checkbox.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * `Checkbox` is a parts object (`Root`/`Indicator`), not a single component —
 * so unlike Button/Toggle there is no meta `component` for the docs-page
 * props table, and react-docgen has nothing useful to say about a namespace
 * object. Args cover the standalone checked/indeterminate/disabled surface
 * plus the `label` this story renders beside it (see the accessible-name
 * note on `States` below for why every checkbox here carries one).
 * `defaultChecked` gets no control — it seeds UNCONTROLLED state, so
 * twiddling it after mount would change nothing and a control that does
 * nothing teaches the wrong lesson about the prop (the same gap
 * select.stories.tsx's `defaultValue` note documents).
 */
type CheckboxArgs = {
  label: string;
  defaultChecked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const meta = {
  title: 'Components/Checkbox',
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Filed for bankruptcy before',
    defaultChecked: false,
    indeterminate: false,
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
          indeterminate={args.indeterminate}
          disabled={args.disabled}
          onCheckedChange={args.onCheckedChange}
        />
      }
      native={
        <LabelledNative
          label={args.label}
          defaultChecked={args.defaultChecked}
          indeterminate={args.indeterminate}
          disabled={args.disabled}
          onCheckedChange={args.onCheckedChange}
        />
      }
    />
  ),
} satisfies Meta<CheckboxArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play starts checked (so the
 * sequence ends there too — a checked box is the more interesting state for
 * the axe pass that follows), unchecks on the first click, and re-checks on
 * the second, asserting `aria-checked` and the shared `onCheckedChange` arg
 * at every step.
 */
export const Basic: Story = {
  args: { defaultChecked: true },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: click unchecks, click again re-checks', async () => {
      const box = web.getByRole('checkbox', { name: args.label });
      await expect(box).toHaveAttribute('aria-checked', 'true');
      await userEvent.click(box);
      await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'false'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(1);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(box);
      await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'true'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });

    await step('native leaf: same checked contract, same handler', async () => {
      const box = native.getByRole('checkbox', { name: args.label });
      await expect(box).toHaveAttribute('aria-checked', 'true');
      await userEvent.click(box);
      await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'false'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(box);
      await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'true'));
      await expect(args.onCheckedChange).toHaveBeenCalledTimes(4);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });
  },
};

/**
 * `Checkbox.Root` renders only a glyph — no text of its own — so it fails
 * `aria-toggle-field-name` (serious, WCAG 1.1.1) without a name, and
 * `Checkbox` does not read `FieldContext`, so wrapping it in a `Field` would
 * not fix that here. The honest label, matching `checkbox.test.tsx`:
 * `aria-label` (web) / `accessibilityLabel` (native) on the Root, with the
 * SAME string rendered as visible text beside it, so the accessible name and
 * the visible label agree (WCAG 2.5.3). Every checkbox story below follows
 * this idiom.
 */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <LabelledWeb label="Filed for bankruptcy before" />
          <LabelledWeb label="Has a co-debtor" defaultChecked />
          <LabelledWeb label="Select all listed debts" indeterminate />
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
          <LabelledNative label="Filed for bankruptcy before" />
          <LabelledNative label="Has a co-debtor" defaultChecked />
          <LabelledNative label="Select all listed debts" indeterminate />
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
      web={<LabelledWeb label="Filing fee waived" disabled defaultChecked />}
      native={<LabelledNative label="Filing fee waived" disabled defaultChecked />}
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('checkbox', { name: 'Filing fee waived' })).toBeDisabled();
    await expect(native.getByRole('checkbox', { name: 'Filing fee waived' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

function LabelledWeb({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof CheckboxWeb.Root>>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <CheckboxWeb.Root aria-label={label} {...props}>
        <CheckboxWeb.Indicator>{props.indeterminate ? '—' : '✓'}</CheckboxWeb.Indicator>
      </CheckboxWeb.Root>
      <span>{label}</span>
    </div>
  );
}

function LabelledNative({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof CheckboxNative.Root>>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <CheckboxNative.Root accessibilityLabel={label} {...props}>
        {/* Raw glyph, matching the web call site — see checkbox.native.tsx's
            Indicator for why a bare <Text> here would paint black. */}
        <CheckboxNative.Indicator>{props.indeterminate ? '—' : '✓'}</CheckboxNative.Indicator>
      </CheckboxNative.Root>
      <Text>{label}</Text>
    </View>
  );
}
