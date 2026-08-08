import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Textarea as TextareaWeb } from '@design-system/textarea/textarea.web.tsx';
import { Textarea as TextareaNative } from '@design-system/textarea/textarea.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

type TextareaArgs = {
  label: string;
  placeholder: string;
  rows: number;
  disabled: boolean;
  invalid: boolean;
  onValueChange: (next: string) => void;
};

/**
 * Multi-line text entry.
 *
 * `rows` is the prop worth watching in this pair. The web leaf hands it to the
 * browser and the browser does the arithmetic; React Native has no `rows` at
 * all — `numberOfLines` sizes the box on Android and does nothing on iOS — so
 * the native leaf computes a `minHeight` from `minHeightForRows`, shared, so
 * the two panes are the same height for the same prop. Drag the web pane's
 * resize handle and the panes will differ; that is the caller resizing it, not
 * the leaves disagreeing.
 *
 * Resizing is vertical-only on web and absent on native: horizontal resize
 * breaks the form's column and has no RN counterpart, so it is not a
 * divergence a caller can drag into existence.
 */
const meta = {
  title: 'Components/Textarea',
  component: TextareaWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Log entry',
    placeholder: 'What happened on approach?',
    rows: 3,
    disabled: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    rows: { control: { type: 'number', min: 1, max: 12 } },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    onValueChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <TextareaWeb
          aria-label={args.label}
          placeholder={args.placeholder}
          rows={args.rows}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <TextareaNative
          aria-label={args.label}
          placeholder={args.placeholder}
          rows={args.rows}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<TextareaArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: typing reports every keystroke', async () => {
      await userEvent.type(web.getByRole('textbox', { name: args.label }), 'Jump');
      await expect(args.onValueChange).toHaveBeenCalledTimes(4);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('Jump');
    });

    await step('native leaf: same contract through a multiline TextInput', async () => {
      await userEvent.type(native.getByRole('textbox', { name: args.label }), 'Jump');
      await expect(args.onValueChange).toHaveBeenCalledTimes(8);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('Jump');
    });
  },
};

/** Six rows, so the shared height arithmetic is visible at a size that matters. */
export const Tall: Story = {
  args: { rows: 6 },
};

/** Disabled and invalid — asserted, not clicked. */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextareaWeb aria-label="Disabled" disabled defaultValue="Locked" />
          <TextareaWeb aria-label="Invalid" invalid defaultValue="Too short" />
        </div>
      }
      native={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextareaNative aria-label="Disabled" disabled defaultValue="Locked" />
          <TextareaNative aria-label="Invalid" invalid defaultValue="Too short" />
        </div>
      }
    />
  ),
};
