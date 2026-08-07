import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { DateInput as DateInputWeb } from '@design-system/date-input/date-input.web.tsx';
import { DateInput as DateInputNative } from '@design-system/date-input/date-input.native.tsx';
import type { DateStatus } from '@design-system/date-input/date-input.props.ts';
import { Field as FieldWeb } from '@design-system/field/field.web.tsx';
import { Field as FieldNative } from '@design-system/field/field.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * Args are typed against the SHARED props surface (`date-input.props.ts`):
 * both leaves take `defaultValue`, `disabled` and `onValueChange` under the
 * same names, so — unlike Button — no bridging arg is needed. `defaultValue`
 * gets no control: it seeds UNCONTROLLED state (`useDateInputState`'s
 * starting `text`), so twiddling it after mount would change nothing on
 * screen — the same reasoning select.stories.tsx gives for its own
 * `defaultValue`.
 */
type DateInputArgs = {
  defaultValue: string;
  disabled: boolean;
  onValueChange: (next: string, status: DateStatus) => void;
};

const meta = {
  title: 'Components/DateInput',
  // The web leaf, for the docs-page props table only (best-effort react-docgen
  // — see the addon-docs note in .storybook/main.ts). Controls never rely on
  // it: they are declared by hand in `argTypes` below.
  component: DateInputWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: '',
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    // Seeds UNCONTROLLED text (`useDateInputState`'s starting value) —
    // twiddling it after mount changes nothing on screen.
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <LabelledWeb
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <LabelledNative
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<DateInputArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The native control is 44dp tall — the WCAG 2.5.5 target-size floor, since a
 * date field is reached by tap far more often than a long-form text field.
 * The web control stays at Field's usual 40dp. Deliberate; see
 * date-input.native.tsx.
 *
 * The play types a full date into each pane and checks the shared
 * `onValueChange` payload: a complete, real date reports its ISO string with
 * `status: 'valid'` — the contract `useDateInputState` exists to provide (see
 * the SECOND ARGUMENT note on `onValueChange` in date-input.props.ts). Typing
 * is the ordinary interaction on both leaves here: DateInput is a masked
 * `<input>`/`TextInput` pair, not a Pressable, so there is no
 * focus-on-click hazard to work around the way select.stories.tsx does for
 * its trigger.
 */
export const Basic: Story = {
  render: (args) => (
    <LeafPair
      note="The native control is 44dp tall — the WCAG 2.5.5 target-size floor, since a date field is reached by tap far more often than a long-form text field. The web control stays at Field's usual 40dp. Deliberate; see date-input.native.tsx."
      web={
        <LabelledWeb
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <LabelledNative
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web: typing a full date reports it as a valid ISO payload', async () => {
      const input = web.getByRole('textbox');
      await userEvent.type(input, '20190214');
      await expect(input).toHaveValue('2019-02-14');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
      // One call per keystroke — eight digits typed, eight calls. Every call
      // before the last reports '' with a non-'valid' status; see the
      // SECOND ARGUMENT note this story's own doc comment points at.
      await expect(args.onValueChange).toHaveBeenCalledTimes(8);
    });

    await step('native: the same masking and payload, through a TextInput', async () => {
      const input = native.getByRole('textbox');
      await userEvent.type(input, '20190214');
      await expect(input).toHaveValue('2019-02-14');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
      // Continues the SAME shared handler from the web step above — 8 there,
      // 8 more here.
      await expect(args.onValueChange).toHaveBeenCalledTimes(16);
    });
  },
};

export const WithValue: Story = {
  args: { defaultValue: '2019-02-14' },
};

/**
 * No typing and no play function needed to reach this state.
 *
 * `defaultValue="2019-02-30"` is eight digits, so `dateStatus` runs the
 * calendar check on first render — and February never has 30 days, so it
 * comes back `invalid` without a `Date` ever being constructed (`isRealDate`
 * in date-input.props.ts works from the plain numbers). That is what puts
 * `aria-invalid` and the danger border on screen immediately, in both panes.
 */
export const InvalidDate: Story = {
  args: { defaultValue: '2019-02-30' },
};

/**
 * Disabled is asserted, not typed into — but not quite the way Button and
 * Select assert it. The web leaf disables the real `<input>` (`toBeDisabled`
 * holds), but the native leaf never sets `aria-disabled` at all:
 * date-input.native.tsx passes only `editable={!disabled}` to its
 * `TextInput`, and react-native-web renders THAT as the DOM `readonly`
 * attribute rather than `disabled` — accessibilityState never reaches the
 * DOM on its own. field.native.tsx documents the identical split for its own
 * `Control`. Asserting `aria-disabled` on this pane would simply fail; the
 * play checks `readonly` instead.
 */
export const Disabled: Story = {
  args: { defaultValue: '2016-11-03', disabled: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('textbox')).toBeDisabled();
    await expect(native.getByRole('textbox')).toHaveAttribute('readonly');
  },
};

/**
 * Every DateInput in these stories is wrapped in a labelled Field, and that is
 * not decoration — the identical note in select.stories.tsx applies verbatim
 * here. A bare `<DateInput placeholder="…">` has no accessible name, so the
 * a11y gate fails it with `aria-input-field-name`; that failure is correct,
 * and it is the STORY's fault for skipping Field, not the component's.
 */
function LabelledWeb(props: Partial<React.ComponentProps<typeof DateInputWeb>>) {
  return (
    <FieldWeb.Root>
      <FieldWeb.Label>Date debt incurred</FieldWeb.Label>
      <DateInputWeb {...props} />
    </FieldWeb.Root>
  );
}

function LabelledNative(props: Partial<React.ComponentProps<typeof DateInputNative>>) {
  return (
    <FieldNative.Root>
      <FieldNative.Label>Date debt incurred</FieldNative.Label>
      <DateInputNative {...props} />
    </FieldNative.Root>
  );
}
