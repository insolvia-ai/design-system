import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Wheel as WheelWeb } from '@design-system/wheel/wheel.web.tsx';
import { Wheel as WheelNative } from '@design-system/wheel/wheel.native.tsx';
import type { WheelItem } from '@design-system/wheel/wheel.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * A realistic long column. Forty-one rows is the point: it is what makes the
 * difference between scrolling and typing worth measuring.
 */
const YEARS: readonly WheelItem[] = Array.from({ length: 41 }, (_, index) => {
  const year = 1990 + index;
  return { value: String(year), label: String(year) };
});

/** A short column with a gap in it, for the unavailable-rows story. */
const SLOTS = [
  { value: '09:00', label: '09:00' },
  { value: '09:30', label: '09:30', disabled: true },
  { value: '10:00', label: '10:00' },
  { value: '10:30', label: '10:30', disabled: true },
  { value: '11:00', label: '11:00' },
] as const satisfies readonly WheelItem[];

type WheelArgs = {
  items: readonly WheelItem[];
  label: string;
  defaultValue: string;
  loop: boolean;
  disabled: boolean;
  onValueChange: (next: string) => void;
};

/**
 * One scrolling column — the primitive `DatePicker` is built out of, and useful
 * on its own for any short ordered list.
 *
 * THE SCROLLING IS AN ENHANCEMENT, NOT THE MECHANISM. Every row is a real
 * option in a listbox: arrows move a row, PageUp/PageDown move a screenful,
 * Home/End jump to the ends, and typing digits jumps to a value. Scroll-snap
 * sits on top of that. Two things follow — the column is operable by keyboard
 * alone, and it is testable at all, because jsdom computes no layout and a
 * wheel that could only be scrolled would be a wheel nothing in CI could drive.
 *
 * It is a LISTBOX rather than a spinbutton, which was the first draft. APG says
 * ArrowUp increases a spinbutton's value, while a wheel's values ascend
 * downwards — so the correct spinbutton binding moves the highlight the
 * opposite way from the key's own arrow. A listbox has no such conflict, and it
 * is the pattern this package already implements once, in Select.
 *
 * WHAT TO LOOK AT HERE. The fade. Rows dim with their distance from the middle,
 * which is what makes a scroll-snap list read as a drum — and it bottoms out at
 * 0.62 rather than fading to nothing, because that is where ink-on-card crosses
 * the 4.5:1 contrast floor this workbench holds every story to. Both panes get
 * the fade from one shared function; if they ever look different, that function
 * is not the reason.
 *
 * `loop` wraps the KEYBOARD, not the scroll. Arrowing past the last minute
 * returns to `00`; flicking still stops at the end. Infinite scrolling means
 * recycling content under the scroller, twice, in two mechanisms no test could
 * see drift apart.
 */
const meta = {
  title: 'Dates/Wheel',
  component: WheelWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    items: YEARS,
    label: 'Year',
    defaultValue: '2020',
    loop: false,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    // Data, not a knob — the two lists this file declares are what the stories
    // switch between.
    items: { control: false },
    label: { control: 'text' },
    // Seeds uncontrolled state only; a control that did nothing after the first
    // render would teach the wrong thing about the prop.
    defaultValue: { control: false },
    loop: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onValueChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={260}
      note="Both columns fade with distance from the middle, from one shared function. Tab into either and drive it with the arrows, PageUp/PageDown, Home/End — or type a year."
      web={
        <WheelWeb
          label={args.label}
          items={args.items}
          defaultValue={args.defaultValue}
          loop={args.loop}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
          style={{ width: 96 }}
        />
      }
      native={
        <WheelNative
          label={args.label}
          items={args.items}
          defaultValue={args.defaultValue}
          loop={args.loop}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
          style={{ width: 96 }}
        />
      }
    />
  ),
} satisfies Meta<WheelArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ends with a different year selected in each pane. Both panes drive the same
 * `onValueChange`, so the play counts calls PER PANE — a pane that silently
 * swallowed its input would otherwise be vouched for by the other one's call.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: a row that is tapped is selected, centred or not', async () => {
      await userEvent.click(web.getByRole('option', { name: '2023' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2023');
    });

    await step('web leaf: the whole column is ONE tab stop', async () => {
      const listbox = web.getByRole('listbox', { name: args.label });
      await expect(listbox).toHaveAttribute('tabindex', '0');
      // Reaching the fortieth row must not mean tabbing past thirty-nine.
      for (const option of web.getAllByRole('option')) {
        await expect(option).toHaveAttribute('tabindex', '-1');
      }
    });

    await step('web leaf: the arrows move a row', async () => {
      // Focus explicitly before typing: a click does not focus an RNW
      // Pressable, and in both leaves it is the listbox that holds focus.
      web.getByRole('listbox', { name: args.label }).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2024');
    });

    await step('native leaf: pressing a row selects it too', async () => {
      await userEvent.click(native.getByRole('option', { name: '2011' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(3);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('2011');
    });
  },
};

/**
 * A column with rows that cannot be chosen — the shape `DatePicker` uses for
 * dates outside `min`/`max`.
 *
 * The unavailable rows are struck through rather than faded further. Another
 * opacity step would drop them under the contrast floor the fade already sits
 * just above, and WCAG 1.4.1 wants a state like this carried by something other
 * than colour anyway.
 */
export const UnavailableRows: Story = {
  args: { items: SLOTS, label: 'Slot', defaultValue: '09:00' },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('both panes mark the taken slots', async () => {
      await expect(web.getByRole('option', { name: '09:30' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      // Asserted, not clicked: react-native-web can only speak ARIA here,
      // never the real `disabled` attribute.
      await expect(native.getByRole('option', { name: '09:30' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    await step('the keyboard steps over them in both panes', async () => {
      web.getByRole('listbox', { name: args.label }).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(args.onValueChange).toHaveBeenLastCalledWith('10:00');

      native.getByRole('listbox', { name: args.label }).focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('10:00');
    });
  },
};
