import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Input as InputWeb } from '@design-system/input/input.web.tsx';
import { Input as InputNative } from '@design-system/input/input.native.tsx';
import type { InputSize, InputType } from '@design-system/input/input.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly InputSize[];
const TYPES = [
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
] as const satisfies readonly InputType[];

type InputArgs = {
  label: string;
  placeholder: string;
  type: InputType;
  size: InputSize;
  disabled: boolean;
  invalid: boolean;
  onValueChange: (next: string) => void;
};

/**
 * The plain text field.
 *
 * `type` is the interesting prop, because it is the one thing here that means
 * something different on each platform and must still mean the SAME thing to
 * the user. The web leaf spells it as `type` plus an autocomplete hint; the
 * native leaf turns it into a keyboard (`email-address` puts an `@` on the
 * key row), a `secureTextEntry` flag, and an autocapitalize rule — because RN
 * capitalizes sentences by default, which turns a typed address into a
 * rejected one on the very first character. `input.props.ts` owns that mapping
 * so neither leaf can drift from what the other promises.
 *
 * Outside a `Field`, name the control with `aria-label`, as these stories do.
 * Inside one, it takes its id, name, description and invalid state from the
 * Field automatically — see the Field story.
 */
const meta = {
  title: 'Components/Input',
  component: InputWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Callsign',
    placeholder: 'Wayfarer',
    type: 'text',
    size: 'md',
    disabled: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    type: { control: 'select', options: [...TYPES] },
    size: { control: 'inline-radio', options: [...SIZES] },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    onValueChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <InputWeb
          aria-label={args.label}
          placeholder={args.placeholder}
          type={args.type}
          size={args.size}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <InputNative
          aria-label={args.label}
          placeholder={args.placeholder}
          type={args.type}
          size={args.size}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<InputArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Both panes drive the same `onValueChange`, so the play counts calls per pane
 * rather than checking only the last one.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: typing reports every keystroke', async () => {
      await userEvent.type(web.getByRole('textbox', { name: args.label }), 'Way');
      await expect(args.onValueChange).toHaveBeenCalledTimes(3);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('Way');
    });

    await step('native leaf: same contract through a TextInput', async () => {
      await userEvent.type(native.getByRole('textbox', { name: args.label }), 'Way');
      await expect(args.onValueChange).toHaveBeenCalledTimes(6);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('Way');
    });
  },
};

/**
 * The three heights side by side. `md` is 44px — the WCAG 2.5.5 target-size
 * floor that the Select trigger and DateInput already hold — and `sm` is a
 * deliberate opt-in to a smaller target for dense forms, exactly as Button's
 * `sm` is.
 */
export const Sizes: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SIZES.map((size) => (
            <InputWeb
              key={size}
              aria-label={`${args.label} ${size}`}
              size={size}
              placeholder={size}
            />
          ))}
        </div>
      }
      native={
        <View style={{ gap: 12 }}>
          {SIZES.map((size) => (
            <InputNative
              key={size}
              aria-label={`${args.label} ${size}`}
              size={size}
              placeholder={size}
            />
          ))}
        </View>
      }
    />
  ),
};

/**
 * Disabled and invalid, the two states a form actually puts a field into.
 * Neither pane is clicked by the play — `disabled` is asserted, never
 * exercised, because clicking a disabled control proves nothing about it.
 */
export const States: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <InputWeb aria-label="Disabled" disabled defaultValue="Locked" />
          <InputWeb aria-label="Invalid" invalid defaultValue="Not a callsign" />
        </div>
      }
      native={
        <View style={{ gap: 12 }}>
          <InputNative aria-label="Disabled" disabled defaultValue="Locked" />
          <InputNative aria-label="Invalid" invalid defaultValue="Not a callsign" />
        </View>
      }
    />
  ),
};
