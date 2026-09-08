import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { NumberInput as NumberInputWeb } from '@design-system/number-input/number-input.web.tsx';
import { NumberInput as NumberInputNative } from '@design-system/number-input/number-input.native.tsx';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * A numeric field with increment/decrement steppers — Base UI's and
 * Material's Number Field is the reference. `value` is a plain
 * `number | null` rather than the string `Input`'s `type="number"` hands
 * back, and typed digits only clamp into `min`/`max` on blur, Enter, or a
 * stepper press — never mid-keystroke, so typing "1" toward "15" against a
 * `min={10}` is not force-corrected before the second digit lands.
 *
 * Every story wraps the field in a labelled `Field.Root`, the same as
 * `Select`'s stories: a bare field has no accessible name, and this
 * package's position is that a control is rendered through Field, not that
 * the a11y gate should learn to accept one that skips it.
 */
type NumberInputArgs = {
  defaultValue: number | null;
  min: number | undefined;
  max: number | undefined;
  step: number;
  disabled: boolean;
  invalid: boolean;
  onValueChange: (next: number | null) => void;
};

const meta = {
  title: 'Forms/NumberInput',
  component: NumberInputWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: 5,
    min: 0,
    max: 10,
    step: 1,
    disabled: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  render: (args) => (
    <LeafPair
      web={
        <LabelledWeb
          defaultValue={args.defaultValue}
          min={args.min}
          max={args.max}
          step={args.step}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <LabelledNative
          defaultValue={args.defaultValue}
          min={args.min}
          max={args.max}
          step={args.step}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<NumberInputArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing: `defaultValue` 5 inside `[0, 10]`. The play steps each
 * pane's `+` once and checks the shared `onValueChange` arg's call COUNT, not
 * just its last call — the two panes share one `fn()`, so a leaf that renders
 * its button but drops the press would otherwise be vouched for by the other
 * pane's earlier call.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: + steps 5 to 6', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Increase' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(6);
      await expect(web.getByRole('spinbutton')).toHaveValue('6');
    });

    await step('native leaf: + steps 5 to 6', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Increase' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(6);
      // The native leaf's TextInput reports DOM role "spinbutton" under
      // react-native-web — RN 0.86's `role="spinbutton"` renders verbatim.
      // See number-input.native.test.tsx's header for the full reasoning.
      await expect(native.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue('6');
    });
  },
};

/**
 * Started AT its max. `+` is disabled in both panes; `−` still works. Web
 * asks a real disabled `<button>`; native can only speak ARIA through
 * react-native-web, the same split every disabled-state story in this
 * package uses.
 */
export const Bounds: Story = {
  args: { defaultValue: 10 },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('button', { name: 'Increase' })).toBeDisabled();
    await expect(native.getByRole('button', { name: 'Increase' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/** A fractional step. The steppers move by 0.5; typing still accepts any decimal. */
export const Decimal: Story = {
  args: { defaultValue: 1.5, min: 0, max: 5, step: 0.5 },
};

export const Invalid: Story = {
  args: { invalid: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
    await expect(native.getByRole('spinbutton', { name: 'Quantity' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('spinbutton')).toBeDisabled();
    await expect(web.getByRole('button', { name: 'Increase' })).toBeDisabled();
    await expect(native.getByRole('spinbutton', { name: 'Quantity' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/**
 * A field wired the way a real form uses it: a description, and an error
 * that only shows once the value goes out of range. Imports Field's leaves
 * directly, which a story may do even though a component leaf may not.
 */
export const InsideAField: Story = {
  render: () => (
    <LeafPair
      web={
        <FieldWeb.Root name="age" invalid>
          <FieldWeb.Label>Age</FieldWeb.Label>
          <FieldWeb.Description>Must be 18 or older.</FieldWeb.Description>
          <NumberInputWeb defaultValue={16} min={0} max={120} />
          <FieldWeb.Error>Enter an age of 18 or older.</FieldWeb.Error>
        </FieldWeb.Root>
      }
      native={
        <FieldNative.Root name="age" invalid>
          <FieldNative.Label>Age</FieldNative.Label>
          <FieldNative.Description>Must be 18 or older.</FieldNative.Description>
          <NumberInputNative defaultValue={16} min={0} max={120} />
          <FieldNative.Error>Enter an age of 18 or older.</FieldNative.Error>
        </FieldNative.Root>
      }
    />
  ),
};

function LabelledWeb(props: Partial<React.ComponentProps<typeof NumberInputWeb>>) {
  return (
    <FieldWeb.Root>
      <FieldWeb.Label>Quantity</FieldWeb.Label>
      <NumberInputWeb {...props} />
    </FieldWeb.Root>
  );
}

function LabelledNative(props: Partial<React.ComponentProps<typeof NumberInputNative>>) {
  return (
    <FieldNative.Root>
      <FieldNative.Label>Quantity</FieldNative.Label>
      <NumberInputNative {...props} />
    </FieldNative.Root>
  );
}
