import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DateInput as DateInputWeb } from '@design-system/date-input/date-input.web.tsx';
import { DateInput as DateInputNative } from '@design-system/date-input/date-input.native.tsx';
import type { DateInputMode } from '@design-system/date-input/date-input.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const MODES = ['date', 'time', 'datetime'] as const satisfies readonly DateInputMode[];

/**
 * A few conventions worth switching between in the Controls panel. The list is
 * not a constraint — `format` takes any arrangement of `YYYY`, `MM`, `DD`, `HH`
 * and `mm` with any punctuation — these are just the ones people actually ask
 * for. `''` means "the mode's own ISO default".
 */
const FORMATS = [
  '',
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'DD.MM.YYYY',
  'HH:mm',
  'MM/DD/YYYY HH:mm',
  'DD/MM/YYYY HH:mm',
] as const;
const INTERVALS = [1, 5, 10, 15, 30] as const;
const CYCLES = [24, 12] as const;

type DateInputArgs = {
  mode: DateInputMode;
  /** `''` uses the mode's default. See FORMATS. */
  format: string;
  /** Pinned, so the story renders the same value every time it is opened. */
  today: string;
  defaultValue: string;
  min: string;
  max: string;
  minuteInterval: (typeof INTERVALS)[number];
  hourCycle: (typeof CYCLES)[number];
  disabled: boolean;
  onValueChange: (next: string, status: string) => void;
};

/**
 * The field most callers want: a masked text input with a button that opens
 * `DatePicker`'s wheels.
 *
 * BOTH HALVES ARE NEEDED AND NEITHER REPLACES THE OTHER. A wheel is slower than
 * typing for a date far from today — a registration from 2011 — and a wheel has
 * no empty state, so a field meaning "nothing chosen yet" cannot say so. A
 * masked field is the fastest way to enter a date you already know and the
 * worst way to answer "which Tuesday is that". 0.12.0's first cut shipped the
 * wheels alone; this is the correction.
 *
 * The empty state comes back with the field, and `onValueChange`'s SECOND
 * argument is what makes it usable: `''` means either "empty" or "still
 * typing", and a caller that autosaves must not treat the second as the first
 * — one backspace on a saved `2020-01-15` reports `''`, and the save lands.
 * Persist on `valid` and `empty`, ignore `incomplete`. Watch the Actions panel
 * while typing and the distinction is right there.
 *
 * NOT `<input type="date">`, which renders a calendar the native leaf cannot
 * match, formats to the browser's locale rather than the one the form asks for,
 * and is the one input whose appearance cannot be styled consistently. This is
 * that control's shape — field, icon, popup — built from parts both platforms
 * have.
 *
 * `format` is what the field READS as — switch it in the Controls panel and the
 * same value reprints as `MM/DD/YYYY`, `DD.MM.YYYY` or whatever the form's
 * convention is. It is presentation only: the STORED value is the same ISO
 * string either way, which is what keeps `min`/`max` one lexicographic compare
 * and lets a single form carry two conventions without two value types.
 *
 * The button's icon is DRAWN from bordered boxes rather than being an SVG or a
 * character: React Native renders no SVG without a dependency this package is
 * forbidden to declare, and the text glyph the first cut used (`▦`) reads as a
 * grey noise square. A bordered box with a bar across its top is a calendar on
 * both platforms. Pass `icon` to replace it.
 */
const meta = {
  title: 'Dates/DateInput',
  component: DateInputWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    mode: 'date',
    format: '',
    today: '2026-03-11',
    defaultValue: '',
    min: '',
    max: '',
    minuteInterval: 1,
    hourCycle: 24,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    mode: { control: 'inline-radio', options: [...MODES] },
    // A select rather than free text: a format that does not fit the mode
    // THROWS by design, and a half-typed one in a text control would throw on
    // every keystroke.
    format: { control: 'select', options: [...FORMATS] },
    today: { control: 'text' },
    // Seeds uncontrolled state only. A control that did nothing after the
    // first render would teach the wrong thing about the prop.
    defaultValue: { control: false },
    min: { control: 'text' },
    max: { control: 'text' },
    minuteInterval: { control: 'inline-radio', options: [...INTERVALS] },
    hourCycle: { control: 'inline-radio', options: [...CYCLES] },
    disabled: { control: 'boolean' },
    onValueChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={420}
      note="Type into either field — it masks as you go — or press the button on the right for the wheels. Both routes reach the same value, and the Actions panel shows the status that tells 'empty' from 'still typing'."
      web={
        <DateInputWeb
          mode={args.mode}
          {...(args.format ? { format: args.format } : {})}
          today={args.today}
          defaultValue={args.defaultValue}
          {...(args.min ? { min: args.min } : {})}
          {...(args.max ? { max: args.max } : {})}
          minuteInterval={args.minuteInterval}
          hourCycle={args.hourCycle}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
          aria-label="Starts"
        />
      }
      native={
        <DateInputNative
          mode={args.mode}
          {...(args.format ? { format: args.format } : {})}
          today={args.today}
          defaultValue={args.defaultValue}
          {...(args.min ? { min: args.min } : {})}
          {...(args.max ? { max: args.max } : {})}
          minuteInterval={args.minuteInterval}
          hourCycle={args.hourCycle}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
          aria-label="Starts"
        />
      }
    />
  ),
} satisfies Meta<DateInputArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends with the picker OPEN in the web pane, which is the state worth auditing:
 * axe runs after the play, so a surface that is never left open is a surface
 * never audited. Only one pane is opened — two anchored surfaces at once make
 * the comparison harder to read, not easier.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: typing masks and reports a complete value', async () => {
      await userEvent.type(web.getByRole('textbox'), '20190214');
      await expect(web.getByRole('textbox')).toHaveValue('2019-02-14');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
    });

    await step('web leaf: a backspace is "still typing", NOT "cleared"', async () => {
      await userEvent.type(web.getByRole('textbox'), '{Backspace}');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('', 'incomplete');
    });

    await step('web leaf: and typing the digit back makes it whole again', async () => {
      await userEvent.type(web.getByRole('textbox'), '4');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
    });

    await step('native leaf: the same typing, the same value', async () => {
      await userEvent.type(native.getByRole('textbox'), '20190214');
      await expect(native.getByRole('textbox')).toHaveValue('2019-02-14');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
    });

    await step('web leaf: the button opens the wheels on the typed date', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Choose a date' }));
      const picker = within(web.getByRole('dialog'));
      await expect(picker.getByText('14 Feb 2019')).toBeInTheDocument();
    });

    await step('web leaf: picking writes back into the field', async () => {
      const picker = within(web.getByRole('dialog'));
      await userEvent.click(
        within(picker.getByRole('listbox', { name: 'Day' })).getByRole('option', { name: '19' }),
      );
      await expect(web.getByRole('textbox')).toHaveValue('2019-02-19');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2019-02-19', 'valid');
    });
  },
};

/**
 * The same field reading month-first.
 *
 * `format` moves the ORDER OF THE DIGITS and nothing else: this types
 * `02142019` and stores `2019-02-14`, exactly as the ISO-ordered field does.
 * That is what lets `min`/`max` stay one lexicographic compare on the stored
 * form no matter which convention a form shows — and what lets two fields on
 * one page disagree about presentation while agreeing about the value.
 *
 * Switch `format` in the Controls panel to see the rest. Anything built from
 * `YYYY`, `MM`, `DD`, `HH` and `mm` works, with any punctuation between them —
 * but `MM` is a month and `mm` is a minute, and a format that does not name
 * exactly the fields its mode needs throws rather than quietly falling back.
 */
export const MonthFirstFormat: Story = {
  args: { format: 'MM/DD/YYYY' },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('the placeholder is the format itself', async () => {
      await expect(web.getByRole('textbox')).toHaveAttribute('placeholder', 'MM/DD/YYYY');
    });

    await step('typing month-first still stores ISO', async () => {
      await userEvent.type(web.getByRole('textbox'), '02142019');
      await expect(web.getByRole('textbox')).toHaveValue('02/14/2019');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
    });

    await step('and a picked date comes back in the same order', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Choose a date' }));
      const picker = within(native.getByRole('dialog'));
      await userEvent.click(
        within(picker.getByRole('listbox', { name: 'Day' })).getByRole('option', { name: '19' }),
      );
      await expect(native.getByRole('textbox')).toHaveValue('03/19/2026');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-19', 'valid');
    });
  },
};

/**
 * The clock, with the button's icon changing to match. The stored value is
 * 24-hour whatever `hourCycle` displays, because `12:30` has to mean one thing.
 */
export const Time: Story = {
  args: { mode: 'time', defaultValue: '09:30', hourCycle: 12 },
  play: async ({ canvasElement, step }) => {
    const { web } = pair(canvasElement);

    await step('the field masks to HH:mm', async () => {
      await expect(web.getByRole('textbox')).toHaveValue('09:30');
      await expect(web.getByRole('textbox')).toHaveAttribute('placeholder', 'HH:mm');
    });

    await step('and the button opens a clock, not a calendar', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Choose a time' }));
      const picker = within(web.getByRole('dialog'));
      await expect(picker.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
      await expect(picker.getByRole('listbox', { name: 'AM or PM' })).toBeInTheDocument();
    });
  },
};

/**
 * Both halves in one field. The mask shows a SPACE where the stored value uses
 * `T`: `2026-03-11T09:30` is what sorts and what the range check compares, and
 * it reads as a typo to whoever is typing.
 */
export const DateAndTime: Story = {
  args: { mode: 'datetime', defaultValue: '2026-03-11T09:30', minuteInterval: 15 },
  play: async ({ canvasElement, step }) => {
    const { web } = pair(canvasElement);

    await step('the field shows a space, the value keeps its T', async () => {
      await expect(web.getByRole('textbox')).toHaveValue('2026-03-11 09:30');
    });

    await step('the button opens all five wheels', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Choose a date and time' }));
      const picker = within(web.getByRole('dialog'));
      const names = picker
        .getAllByRole('listbox')
        .map((listbox) => listbox.getAttribute('aria-label'));
      await expect(names).toEqual(['Day', 'Month', 'Year', 'Hour', 'Minute']);
    });
  },
};

/**
 * A date the calendar does not have.
 *
 * `2019-02-30` is eight real digits and no such day — and `new Date` would
 * accept it, rolling silently to 2 March. The status is `invalid`, the field is
 * `aria-invalid`, and `onValueChange` reports `''`, so nothing downstream can
 * store the rolled-over date.
 *
 * A deliberately-invalid state, so the a11y gate is scoped OFF for this story
 * alone rather than weakened for everyone: `aria-invalid` with no accompanying
 * error message is the finding, and here there is deliberately no `Field` to
 * carry one.
 */
export const ImpossibleDate: Story = {
  parameters: { a11y: { test: 'todo' } },
  play: async ({ canvasElement, args, step }) => {
    const { web } = pair(canvasElement);

    await step('eight digits, no such day', async () => {
      await userEvent.type(web.getByRole('textbox'), '20190230');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('', 'invalid');
      await expect(web.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
