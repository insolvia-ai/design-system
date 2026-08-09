import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

import { DatePicker as DatePickerWeb } from '@design-system/date-picker/date-picker.web.tsx';
import { DatePicker as DatePickerNative } from '@design-system/date-picker/date-picker.native.tsx';
import type { DatePickerMode } from '@design-system/date-picker/date-picker.props.ts';
import { Drawer as DrawerWeb } from '@design-system/drawer/drawer.web.tsx';
import { Drawer as DrawerNative } from '@design-system/drawer/drawer.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

const MODES = ['date', 'time', 'datetime'] as const satisfies readonly DatePickerMode[];
const INTERVALS = [1, 5, 10, 15, 30] as const;
const CYCLES = [24, 12] as const;

type DatePickerArgs = {
  mode: DatePickerMode;
  /** Pinned, so the story renders the same value every time it is opened. */
  today: string;
  defaultValue: string;
  min: string;
  max: string;
  minuteInterval: (typeof INTERVALS)[number];
  hourCycle: (typeof CYCLES)[number];
  disabled: boolean;
  onValueChange: (next: string) => void;
};

/**
 * The package's one date surface: a row of scrolling wheels, one per part.
 *
 * It REPLACED two components in 0.12.0 — a masked `YYYY-MM-DD` text field and
 * a month grid — and the cost of that is worth knowing rather than
 * rediscovering. A wheel is slower than typing for a date far from today, so
 * every column here takes DIGIT TYPEAHEAD: tab into the year and type `2011`
 * and it goes there. And a wheel has no empty state — it always shows some
 * value — so a form meaning "no date chosen yet" says so by not showing the
 * picker, not by showing an empty one.
 *
 * `today` is a PROP, never a `new Date()` call inside the component: something
 * that reads the clock cannot be rendered twice with the same result, which
 * makes it untestable and makes this story's screenshot different every day.
 *
 * Three things the columns do that a naive picker does not. The DAY column is
 * derived from the selected year and month, so 30 February is not a row that is
 * refused — it is not a row. Changing month CLAMPS the day rather than rolling
 * over: 31 January plus a switch to February is the 28th, where JS's own `Date`
 * gives 3 March and the month change skips February entirely. And a row outside
 * `min`/`max` is struck through and skipped by both the keyboard and a flick.
 *
 * There is no modal here on purpose. `Dialog` and `Drawer` already own
 * presentation, focus trapping and dismissal in this package; see the
 * `InsideADrawer` story for the bottom-sheet composition that a second overlay
 * implementation would only duplicate.
 */
const meta = {
  title: 'Dates/DatePicker',
  component: DatePickerWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    mode: 'date',
    today: '2026-03-11',
    defaultValue: '2026-03-11',
    min: '',
    max: '',
    minuteInterval: 1,
    hourCycle: 24,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    mode: { control: 'inline-radio', options: [...MODES] },
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
      minPaneWidth={400}
      note="One value, composed from every column — the line above the wheels says it, and is a live region so a screen reader hears the whole date rather than 'Mar, selected'."
      web={
        <DatePickerWeb
          mode={args.mode}
          today={args.today}
          defaultValue={args.defaultValue}
          {...(args.min ? { min: args.min } : {})}
          {...(args.max ? { max: args.max } : {})}
          minuteInterval={args.minuteInterval}
          hourCycle={args.hourCycle}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <DatePickerNative
          mode={args.mode}
          today={args.today}
          defaultValue={args.defaultValue}
          {...(args.min ? { min: args.min } : {})}
          {...(args.max ? { max: args.max } : {})}
          minuteInterval={args.minuteInterval}
          hourCycle={args.hourCycle}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<DatePickerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The column with this accessible name, inside one pane. */
function column(pane: ReturnType<typeof within>, name: string) {
  return within(pane.getByRole('listbox', { name }));
}

/**
 * Ends with a date selected in each pane. Both panes drive the same
 * `onValueChange`, so the play counts calls PER PANE — a pane that silently
 * swallowed its input would otherwise be vouched for by the other one's call.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: a column composes the whole value', async () => {
      await userEvent.click(column(web, 'Day').getByRole('option', { name: '19' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-19');
    });

    await step('web leaf: the summary follows', async () => {
      await expect(web.getByText('19 Mar 2026')).toBeInTheDocument();
    });

    await step('native leaf: the same press, the same value', async () => {
      await userEvent.click(column(native, 'Day').getByRole('option', { name: '19' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-19');
    });

    await step('both panes clamp the day rather than rolling the month over', async () => {
      // 31 January plus a switch to February is the 28th, not 3 March.
      await userEvent.click(column(web, 'Day').getByRole('option', { name: '31' }));
      await userEvent.click(column(web, 'Month').getByRole('option', { name: 'Feb' }));
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-02-28');
      await expect(web.getByText('28 Feb 2026')).toBeInTheDocument();
    });
  },
};

/**
 * Both halves at once — five columns, with the clock set apart from the date by
 * a gap rather than a rule.
 *
 * The stored value is `YYYY-MM-DDTHH:mm`: no seconds, no timezone. It sorts
 * lexicographically in chronological order, which is why `min` and `max` stay a
 * string comparison in every mode and no `Date` is constructed anywhere.
 */
export const DateAndTime: Story = {
  args: { mode: 'datetime', defaultValue: '2026-03-11T09:30', minuteInterval: 15 },
  play: async ({ canvasElement, args, step }) => {
    const { web } = pair(canvasElement);

    await step('the columns read date-then-time', async () => {
      const names = web
        .getAllByRole('listbox')
        .map((listbox) => listbox.getAttribute('aria-label'));
      await expect(names).toEqual(['Day', 'Month', 'Year', 'Hour', 'Minute']);
    });

    await step('the minute column steps by the interval', async () => {
      const labels = column(web, 'Minute')
        .getAllByRole('option')
        .map((option) => option.textContent);
      await expect(labels).toEqual(['00', '15', '30', '45']);
    });

    await step('choosing an hour recomposes the whole value', async () => {
      await userEvent.click(column(web, 'Hour').getByRole('option', { name: '17' }));
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-11T17:30');
    });
  },
};

/**
 * A twelve-hour clock. The AM/PM column is DISPLAY only — the stored value
 * stays 24-hour, because `12:30` has to mean one thing.
 */
export const TwelveHourClock: Story = {
  args: { mode: 'time', defaultValue: '09:30', hourCycle: 12 },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: switching to PM stores the 24-hour value', async () => {
      await userEvent.click(column(web, 'AM or PM').getByRole('option', { name: 'PM' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('21:30');
      await expect(web.getByText('9:30 PM')).toBeInTheDocument();
    });

    await step('native leaf agrees', async () => {
      await userEvent.click(column(native, 'AM or PM').getByRole('option', { name: 'PM' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('21:30');
    });
  },
};

/**
 * A bounded window, and the thing worth staring at: a row outside it is struck
 * through rather than faded further.
 *
 * Another opacity step would drop those rows under the 4.5:1 contrast floor the
 * fade already sits just above, and WCAG 1.4.1 wants a state like this carried
 * by more than colour. The strike is also what a screen reader's
 * `aria-disabled` says out loud.
 *
 * A month is forbidden only when NO date inside it is reachable, so March
 * survives a `min` of the 15th — and choosing March then lands on the 15th
 * rather than somewhere outside the window.
 */
export const Bounded: Story = {
  args: { defaultValue: '2026-04-02', min: '2026-03-15', max: '2026-05-31' },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('a month with no reachable day is struck out; a partial one is not', async () => {
      await expect(column(web, 'Month').getByRole('option', { name: 'Feb' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await expect(column(web, 'Month').getByRole('option', { name: 'Mar' })).not.toHaveAttribute(
        'aria-disabled',
      );
    });

    await step('the year column is bounded rather than struck out', async () => {
      const labels = column(web, 'Year')
        .getAllByRole('option')
        .map((option) => option.textContent);
      await expect(labels).toEqual(['2026']);
    });

    await step('choosing a partial month lands inside the window', async () => {
      await userEvent.click(column(web, 'Month').getByRole('option', { name: 'Mar' }));
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-15');
    });

    await step('the native pane marks the same rows', async () => {
      // Asserted, not clicked: react-native-web can only speak ARIA here,
      // never the real `disabled` attribute.
      await expect(column(native, 'Month').getByRole('option', { name: 'Feb' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  },
};

/**
 * The answer to "where is the modal?".
 *
 * `Dialog` and `Drawer` already own presentation, focus trapping, scroll
 * locking and dismissal in this package, and a second implementation inside the
 * picker would be a second thing to keep correct. A bottom Drawer is the mobile
 * convention, and this is what it costs to compose: nothing.
 *
 * Worth looking at rather than only asserting — the wheels must not be clipped
 * by the sheet or painted underneath it. That failure class is the 0.7.1 Select
 * bug, which every test in this repo passed.
 */
export const InsideADrawer: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={400}
      note="Open ONE pane at a time — two modals at once fight over focus. The sheet covers the whole window, not its pane."
      web={
        <DrawerWeb.Root side="bottom">
          <DrawerWeb.Trigger>Pick a date</DrawerWeb.Trigger>
          <DrawerWeb.Backdrop />
          <DrawerWeb.Panel>
            <DrawerWeb.Title>When does it start?</DrawerWeb.Title>
            <DatePickerWeb
              today={args.today}
              defaultValue={args.defaultValue}
              onValueChange={args.onValueChange}
            />
            <DrawerWeb.Close>Done</DrawerWeb.Close>
          </DrawerWeb.Panel>
        </DrawerWeb.Root>
      }
      native={
        <DrawerNative.Root side="bottom">
          <DrawerNative.Trigger>Pick a date</DrawerNative.Trigger>
          <DrawerNative.Backdrop />
          <DrawerNative.Panel>
            <DrawerNative.Title>When does it start?</DrawerNative.Title>
            <DatePickerNative
              today={args.today}
              defaultValue={args.defaultValue}
              onValueChange={args.onValueChange}
            />
            <DrawerNative.Close>Done</DrawerNative.Close>
          </DrawerNative.Panel>
        </DrawerNative.Root>
      }
    />
  ),
  play: async ({ canvasElement, args, step }) => {
    const { web } = pair(canvasElement);

    // The panel portals out of both panes, so it is reached through `screen`
    // rather than `pair()` — and only one leaf is opened, because two open
    // modals fight over focus and `aria-hidden`. dialog.stories.tsx's header
    // owns the full reasoning.
    await step('the picker works inside the sheet', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Pick a date' }));
      const sheet = within(await screen.findByRole('dialog'));
      await userEvent.click(
        within(sheet.getByRole('listbox', { name: 'Day' })).getByRole('option', { name: '19' }),
      );
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-19');
    });

    // A modal is the one exception to ending in the open state: axe runs after
    // the play, and an open sheet leaves the rest of the story `aria-hidden`.
    await step('and closes again', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Done' }));
      await waitFor(async () => {
        await expect(screen.queryByRole('dialog')).toBeNull();
      });
    });
  },
};
