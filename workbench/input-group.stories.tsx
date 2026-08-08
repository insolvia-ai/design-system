import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { InputGroup as InputGroupWeb } from '@design-system/input-group/input-group.web.tsx';
import { InputGroup as InputGroupNative } from '@design-system/input-group/input-group.native.tsx';
import { Input as InputWeb } from '@design-system/input/input.web.tsx';
import { Input as InputNative } from '@design-system/input/input.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * `InputGroup` is a parts object (`Root`/`Text`), so there is no meta
 * `component`. The args cover the row's own state plus the addon text and the
 * control threaded into it.
 */
type InputGroupArgs = {
  label: string;
  prefix: string;
  suffix: string;
  invalid: boolean;
  disabled: boolean;
  onValueChange: (next: string) => void;
};

/**
 * A control joined to the text beside it, drawn as ONE box.
 *
 * The invariant is that the Root owns the border, the radius and the focus
 * ring, and the control inside stops drawing its own — otherwise you get a
 * double border, which reads as "the design system is sloppy" rather than
 * "this call site is wrong". `Input` and `Textarea` learn that from context
 * rather than from a prop the caller has to remember on both leaves.
 *
 * ONE DELIBERATE DIVERGENCE, visible here: the web pane draws a focus ring
 * around the whole row (`focus-within:`), and the native pane does not. React
 * Native has no focus pseudo-class and no ring — a TextInput shows focus
 * through the platform's own caret — and faking one with state would only ever
 * be right on web. Click into each pane and the difference is the point.
 */
const meta = {
  title: 'Forms/InputGroup',
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Domain',
    prefix: 'https://',
    suffix: '.example',
    invalid: false,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    prefix: { control: 'text' },
    suffix: { control: 'text' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onValueChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={360}
      web={
        <InputGroupWeb.Root invalid={args.invalid} disabled={args.disabled}>
          <InputGroupWeb.Text>{args.prefix}</InputGroupWeb.Text>
          <InputWeb
            aria-label={args.label}
            placeholder="wayfarer"
            disabled={args.disabled}
            onValueChange={args.onValueChange}
          />
          <InputGroupWeb.Text>{args.suffix}</InputGroupWeb.Text>
        </InputGroupWeb.Root>
      }
      native={
        <InputGroupNative.Root invalid={args.invalid} disabled={args.disabled}>
          <InputGroupNative.Text>{args.prefix}</InputGroupNative.Text>
          <InputNative
            aria-label={args.label}
            placeholder="wayfarer"
            disabled={args.disabled}
            onValueChange={args.onValueChange}
          />
          <InputGroupNative.Text>{args.suffix}</InputGroupNative.Text>
        </InputGroupNative.Root>
      }
    />
  ),
} satisfies Meta<InputGroupArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: the control inside the row still takes input', async () => {
      await userEvent.type(web.getByRole('textbox', { name: args.label }), 'ship');
      await expect(args.onValueChange).toHaveBeenCalledTimes(4);
    });

    await step('native leaf: same', async () => {
      await userEvent.type(native.getByRole('textbox', { name: args.label }), 'ship');
      await expect(args.onValueChange).toHaveBeenCalledTimes(8);
    });

    await step('the addons are text, not part of the control’s name', async () => {
      // An addon reading "https://" does not name the field — a Field.Label
      // does — so the control keeps the name the caller gave it.
      await expect(web.getByText(args.prefix)).toBeInTheDocument();
      await expect(native.getByText(args.prefix)).toBeInTheDocument();
    });
  },
};

/** A leading addon only — the commonest shape. */
export const PrefixOnly: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={360}
      web={
        <InputGroupWeb.Root>
          <InputGroupWeb.Text>@</InputGroupWeb.Text>
          <InputWeb aria-label="Handle" placeholder="wayfarer" />
        </InputGroupWeb.Root>
      }
      native={
        <InputGroupNative.Root>
          <InputGroupNative.Text>@</InputGroupNative.Text>
          <InputNative aria-label="Handle" placeholder="wayfarer" />
        </InputGroupNative.Root>
      }
    />
  ),
};
