import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Calendar as CalendarWeb } from '@design-system/calendar/calendar.web.tsx';
import { Calendar as CalendarNative } from '@design-system/calendar/calendar.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

type CalendarArgs = {
  /** Pinned, so the story renders the same month every time it is opened. */
  today: string;
  defaultValue: string;
  min: string;
  max: string;
  onValueChange: (next: string) => void;
};

/**
 * A month grid for choosing a date — the pointing counterpart to `DateInput`'s
 * typing. The two share `daysInMonth` and `isRealDate` from
 * `date-input.props`, because they must agree about what a date IS.
 *
 * `today` is a PROP, not a `new Date()` call inside the component. A component
 * that reads the clock cannot be rendered twice with the same result, which
 * makes it untestable and makes this story's screenshot different every day.
 *
 * Two decisions worth knowing about. The grid is ALWAYS six weeks, even when
 * five would do: a grid that changed height as you page would move the
 * controls under it, and the button you were about to press ends up somewhere
 * else. And `shiftMonths` clamps rather than rolling over — 31 January plus a
 * month is 28 February, where JS's own Date gives 3 March and a "next month"
 * button skips February entirely.
 *
 * Keyboard: arrows by a day or a week, PageUp/PageDown by a month, Home/End to
 * the ends of the WEEK, Enter or Space to choose. One roving tab stop, so
 * reaching the 15th does not mean tabbing through fourteen buttons.
 */
const meta = {
  title: 'Components/Calendar',
  parameters: { layout: 'fullscreen' },
  args: {
    today: '2026-03-11',
    defaultValue: '2026-03-17',
    min: '',
    max: '',
    onValueChange: fn(),
  },
  argTypes: {
    today: { control: 'text' },
    defaultValue: { control: false },
    min: { control: 'text' },
    max: { control: 'text' },
    onValueChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={340}
      note="Both grids are six weeks tall in every month. Each day announces as '17 March 2026' — the number alone is ambiguous when two months are on screen."
      web={
        <CalendarWeb
          today={args.today}
          defaultValue={args.defaultValue}
          {...(args.min ? { min: args.min } : {})}
          {...(args.max ? { max: args.max } : {})}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <CalendarNative
          today={args.today}
          defaultValue={args.defaultValue}
          {...(args.min ? { min: args.min } : {})}
          {...(args.max ? { max: args.max } : {})}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<CalendarArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends with a date selected in each pane. Both panes drive the same
 * `onValueChange`, so the play counts calls per pane.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: clicking a day selects it', async () => {
      await userEvent.click(web.getByRole('button', { name: '19 March 2026' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-19');
    });

    await step('web leaf: exactly one cell is in the tab order', async () => {
      const tabbable = web
        .getAllByRole('button')
        .filter((button) => button.getAttribute('tabindex') === '0');
      await expect(tabbable).toHaveLength(1);
    });

    await step('native leaf: pressing a day selects it', async () => {
      await userEvent.click(native.getByRole('button', { name: '19 March 2026' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2026-03-19');
    });

    await step('both panes page to the same month', async () => {
      await userEvent.click(web.getByRole('button', { name: 'Next month' }));
      await userEvent.click(native.getByRole('button', { name: 'Next month' }));
      await expect(web.getByText('April 2026')).toBeInTheDocument();
      await expect(native.getByText('April 2026')).toBeInTheDocument();
    });
  },
};

/**
 * A bounded range. Days outside it are `aria-disabled` rather than removed, so
 * the shape of the month stays readable and a screen-reader user can still
 * tell what is there.
 */
export const Bounded: Story = {
  args: { min: '2026-03-10', max: '2026-03-20' },
};

/**
 * Nothing chosen yet — the grid opens on the month of `today` and marks it
 * with `aria-current="date"`.
 */
export const Empty: Story = {
  args: { defaultValue: '' },
  render: (args) => (
    <LeafPair
      minPaneWidth={340}
      web={<CalendarWeb today={args.today} onValueChange={args.onValueChange} />}
      native={<CalendarNative today={args.today} onValueChange={args.onValueChange} />}
    />
  ),
};
