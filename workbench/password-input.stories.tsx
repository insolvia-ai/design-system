import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { PasswordInput as PasswordInputWeb } from '@design-system/password-input/password-input.web.tsx';
import { PasswordInput as PasswordInputNative } from '@design-system/password-input/password-input.native.tsx';
import type { PasswordInputAutoComplete } from '@design-system/password-input/password-input.props.ts';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

const AUTO_COMPLETES = [
  'current-password',
  'new-password',
] as const satisfies readonly PasswordInputAutoComplete[];

type PasswordInputArgs = {
  label: string;
  placeholder: string;
  defaultValue: string;
  disabled: boolean;
  invalid: boolean;
  autoComplete: PasswordInputAutoComplete;
  onValueChange: (next: string) => void;
  onRevealedChange: (next: boolean) => void;
};

/**
 * A password field with a show/hide toggle. `Input` already accepts
 * `type="password"` and hides what it holds; that is where its job ends — the
 * reveal control is a second focusable element with its own accessible name
 * and pressed state, which is why it is this component rather than a prop on
 * `Input`. See `password-input.props.ts` for the full reasoning.
 *
 * The toggle looks different per pane ON PURPOSE: the web leaf draws an
 * inline SVG eye/eye-off glyph, free on the DOM; React Native has no SVG
 * primitive without a native dependency this package cannot declare, so the
 * native toggle reads "Show"/"Hide" instead. Compare the two panes on
 * BEHAVIOUR — both flip the same `onRevealedChange`, through the same
 * controlled/uncontrolled contract — not on the pixels the toggle draws.
 */
const meta = {
  title: 'Forms/PasswordInput',
  component: PasswordInputWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Password',
    placeholder: '',
    defaultValue: '',
    disabled: false,
    invalid: false,
    autoComplete: 'current-password',
    onValueChange: fn(),
    onRevealedChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    // Seeds UNCONTROLLED text — twiddling it after mount changes nothing on
    // screen, the same reasoning select.stories.tsx gives its own
    // `defaultValue`.
    defaultValue: { control: false },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    autoComplete: { control: 'inline-radio', options: [...AUTO_COMPLETES] },
    onValueChange: { control: false },
    onRevealedChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <PasswordInputWeb
          aria-label={args.label}
          placeholder={args.placeholder}
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          invalid={args.invalid}
          autoComplete={args.autoComplete}
          onValueChange={args.onValueChange}
          onRevealedChange={args.onRevealedChange}
        />
      }
      native={
        <PasswordInputNative
          aria-label={args.label}
          placeholder={args.placeholder}
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          invalid={args.invalid}
          autoComplete={args.autoComplete}
          onValueChange={args.onValueChange}
          onRevealedChange={args.onRevealedChange}
        />
      }
    />
  ),
} satisfies Meta<PasswordInputArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Each pane's toggle is driven once. Both start hidden and both end revealed
 * — the play ends the story in the state axe (which runs AFTER the play)
 * should audit: a real password showing as plain text next to its own
 * "Hide password" button.
 */
export const Basic: Story = {
  args: {
    defaultValue: 'hunter2',
  },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: the toggle reveals the password', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Show password' }));
      await expect(args.onRevealedChange).toHaveBeenCalledTimes(1);
      await expect(args.onRevealedChange).toHaveBeenLastCalledWith(true);
      await expect(web.getByLabelText('Password')).toHaveAttribute('type', 'text');
      await expect(web.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    await step('native leaf: the same toggle, through a Pressable', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Show password' }));
      // The two panes share one `onRevealedChange` — call COUNT, not just the
      // last call, so the web step above is still vouched for.
      await expect(args.onRevealedChange).toHaveBeenCalledTimes(2);
      await expect(args.onRevealedChange).toHaveBeenLastCalledWith(true);
      await expect(native.getByLabelText('Password')).toHaveAttribute('type', 'text');
    });
  },
};

/**
 * `autoComplete="new-password"` is what a sign-up or change-password form
 * asks for — the password manager OFFERS a generated password instead of
 * filling a saved one.
 */
export const NewPassword: Story = {
  name: 'New password (sign-up)',
  args: {
    label: 'New password',
    autoComplete: 'new-password',
  },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: 'short' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'hunter2' },
};

/**
 * Composed the everyday way: inside a labelled `Field.Root`, exactly as
 * `Input` is. The id, `aria-describedby` and invalid state all come from the
 * Field rather than being passed twice — see `select.stories.tsx`'s
 * `LabelledWeb`/`LabelledNative` for the same pattern on another control.
 */
export const InsideAField: Story = {
  render: (args) => (
    <LeafPair
      web={
        <FieldWeb.Root invalid={args.invalid}>
          <FieldWeb.Label>{args.label}</FieldWeb.Label>
          <PasswordInputWeb
            placeholder={args.placeholder}
            defaultValue={args.defaultValue}
            disabled={args.disabled}
            autoComplete={args.autoComplete}
            onValueChange={args.onValueChange}
            onRevealedChange={args.onRevealedChange}
          />
          <FieldWeb.Description>At least 12 characters.</FieldWeb.Description>
        </FieldWeb.Root>
      }
      native={
        <FieldNative.Root invalid={args.invalid}>
          <FieldNative.Label>{args.label}</FieldNative.Label>
          <PasswordInputNative
            placeholder={args.placeholder}
            defaultValue={args.defaultValue}
            disabled={args.disabled}
            autoComplete={args.autoComplete}
            onValueChange={args.onValueChange}
            onRevealedChange={args.onRevealedChange}
          />
          <FieldNative.Description>At least 12 characters.</FieldNative.Description>
        </FieldNative.Root>
      }
    />
  ),
};
