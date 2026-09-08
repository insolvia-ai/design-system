import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { PinInput as PinInputWeb } from '@design-system/pin-input/pin-input.web.tsx';
import { PinInput as PinInputNative } from '@design-system/pin-input/pin-input.native.tsx';
import type { PinInputType } from '@design-system/pin-input/pin-input.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const TYPES = ['numeric', 'alphanumeric'] as const satisfies readonly PinInputType[];

/**
 * A one-time-code field: `length` single-character boxes, auto-advancing as
 * each is filled. The web leaf is `length` real `<input>`s (Chakra's
 * `PinInput` shape); the native leaf is ONE invisible `TextInput` — the shape
 * a phone's SMS autofill actually writes into — with the boxes drawn from it.
 * Compare the two panes for the thing that has to be identical despite that:
 * the auto-advance, backspace, and paste behaviour, all driven by the same
 * state machine in `pin-input.props.ts`.
 */
type PinInputArgs = {
  length: number;
  type: PinInputType;
  mask: boolean;
  disabled: boolean;
  invalid: boolean;
  defaultValue: string;
  label: string;
  onValueChange: (next: string) => void;
  onComplete: (code: string) => void;
};

const meta = {
  title: 'Forms/PinInput',
  component: PinInputWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    length: 6,
    type: 'numeric',
    mask: false,
    disabled: false,
    invalid: false,
    defaultValue: '',
    label: 'Verification code',
    onValueChange: fn(),
    onComplete: fn(),
  },
  argTypes: {
    length: { control: { type: 'number', min: 3, max: 8 } },
    type: { control: 'radio', options: TYPES },
    // Seeds UNCONTROLLED state only — twiddling it after mount changes
    // nothing, the same gap select.stories.tsx's `defaultValue` note covers.
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <PinInputWeb
          length={args.length}
          type={args.type}
          mask={args.mask}
          disabled={args.disabled}
          invalid={args.invalid}
          defaultValue={args.defaultValue}
          label={args.label}
          onValueChange={args.onValueChange}
          onComplete={args.onComplete}
        />
      }
      native={
        <PinInputNative
          length={args.length}
          type={args.type}
          mask={args.mask}
          disabled={args.disabled}
          invalid={args.invalid}
          defaultValue={args.defaultValue}
          label={args.label}
          onValueChange={args.onValueChange}
          onComplete={args.onComplete}
        />
      }
    />
  ),
} satisfies Meta<PinInputArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Types a full six-digit code into each pane and checks `onComplete` fires
 * exactly once, with the whole code — the fire-once rule `usePinInputState`
 * owns. The web pane drives its six boxes by keyboard from the first one; the
 * native pane types straight into the one hidden field that stands in for all
 * six.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: click the first box, type the whole code', async () => {
      await userEvent.click(web.getByLabelText('Digit 1 of 6'));
      await userEvent.keyboard('123456');
      // Call COUNT, not just the last call — the two panes share one fn()
      // arg, so a pane that silently drops input would otherwise be vouched
      // for by the other pane's earlier call.
      await expect(args.onComplete).toHaveBeenCalledTimes(1);
      await expect(args.onComplete).toHaveBeenLastCalledWith('123456');
    });

    await step('native leaf: focus the hidden field and type', async () => {
      const hidden = native.getByLabelText('Verification code');
      hidden.focus();
      await userEvent.keyboard('123456');
      await expect(args.onComplete).toHaveBeenCalledTimes(2);
      await expect(args.onComplete).toHaveBeenLastCalledWith('123456');
    });
  },
};

/** Letters and digits, always uppercased — an invite code read off a screen, not a credential. */
export const Alphanumeric: Story = {
  args: { type: 'alphanumeric', label: 'Invite code' },
};

/**
 * `mask` paints `•` over a filled box without switching to `type="password"`
 * — see the web leaf's header for why that would be the wrong instrument
 * here.
 */
export const Masked: Story = {
  args: { mask: true, defaultValue: '1234' },
};

/** A 4-digit banking-style PIN rather than a 6-digit SMS code. */
export const FourDigits: Story = {
  name: 'Four digits',
  args: { length: 4 },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: '12' },
};

/**
 * Disabled is asserted, not clicked: the web boxes are real disabled
 * `<input>`s (`toBeDisabled`), the native hidden field can only speak ARIA
 * through react-native-web (`aria-disabled`).
 */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: '123' },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByLabelText('Digit 1 of 6')).toBeDisabled();
    await expect(native.getByLabelText('Verification code')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
