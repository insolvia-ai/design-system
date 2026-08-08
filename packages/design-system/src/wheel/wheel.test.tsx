// Behavioural tests for the WEB leaf. Everything here is driven by keyboard and
// clicks, never by scrolling: jsdom computes no layout, so `scroll-snap` and
// `scrollTop` do nothing there. That is not a gap being worked around — it is
// the wheel's own design (see wheel.props.ts), and these tests are what prove
// the column stays operable with the scrolling taken away.
import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { WheelItem } from './wheel.props';
import { Wheel } from './wheel.web';

/** A realistic year column: long enough that typing beats scrolling. */
const YEARS: WheelItem[] = Array.from({ length: 41 }, (_, index) => {
  const year = 1990 + index;
  return { value: String(year), label: String(year) };
});

function renderWheel(overrides: Partial<React.ComponentProps<typeof Wheel>> = {}) {
  const onValueChange = vi.fn();
  const view = render(
    <Wheel
      label="Year"
      items={YEARS}
      defaultValue="2020"
      onValueChange={onValueChange}
      {...overrides}
    />,
  );
  return { ...view, onValueChange, listbox: screen.getByRole('listbox', { name: 'Year' }) };
}

/** Typeahead is a burst of keydowns; `userEvent` would space them out. */
function typeDigits(listbox: HTMLElement, digits: string) {
  for (const digit of digits) fireEvent.keyDown(listbox, { key: digit });
}

describe('Wheel', () => {
  it('is one listbox with one option per row', () => {
    renderWheel();
    expect(screen.getAllByRole('option')).toHaveLength(YEARS.length);
    expect(screen.getByRole('option', { name: '2020' })).toHaveAttribute('aria-selected', 'true');
  });

  it('is a single tab stop, however many rows it has', () => {
    // Reaching the fortieth row must not mean tabbing past thirty-nine buttons.
    const { listbox } = renderWheel();
    expect(listbox).toHaveAttribute('tabindex', '0');
    for (const option of screen.getAllByRole('option')) {
      expect(option).toHaveAttribute('tabindex', '-1');
    }
  });

  it('points aria-activedescendant at the selected row', () => {
    const { listbox } = renderWheel();
    expect(listbox.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: '2020' }).id,
    );
  });

  it('moves a row at a time on the arrows', async () => {
    const user = userEvent.setup();
    const { listbox, onValueChange } = renderWheel();
    listbox.focus();

    await user.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenLastCalledWith('2021');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith('2019');
  });

  it('jumps to the ends on Home and End', async () => {
    const user = userEvent.setup();
    const { listbox, onValueChange } = renderWheel();
    listbox.focus();

    await user.keyboard('{End}');
    expect(onValueChange).toHaveBeenLastCalledWith('2030');
    await user.keyboard('{Home}');
    expect(onValueChange).toHaveBeenLastCalledWith('1990');
  });

  it('jumps to a year that is TYPED, which is the answer to a long column', () => {
    // The reason a wheel can replace a masked text field at all: a date far
    // from today is four keystrokes away rather than forty rows of scrolling.
    const { listbox, onValueChange } = renderWheel();
    listbox.focus();

    typeDigits(listbox, '2011');
    expect(onValueChange).toHaveBeenLastCalledWith('2011');
  });

  it('selects a row that is TAPPED even when it is not the centred one', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderWheel();

    await user.click(screen.getByRole('option', { name: '2023' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('2023');
  });

  it('does not let a tap park focus on the row it hit', async () => {
    // A browser focuses a button on mousedown. Left alone that parks focus on a
    // `tabIndex={-1}` row: the arrows then go nowhere, because the key handler
    // is on the listbox, and the row wears the browser's own focus ring on top
    // of the selection band. Caught in the workbench as a stray blue outline.
    const user = userEvent.setup();
    const { listbox } = renderWheel();
    listbox.focus();

    await user.click(screen.getByRole('option', { name: '2023' }));
    expect(document.activeElement).toBe(listbox);

    // And the arrows still work, which is the point of keeping focus here.
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: '2024' })).toHaveAttribute('aria-selected', 'true');
  });

  it('stops at the end when it does not loop', async () => {
    const user = userEvent.setup();
    const { listbox, onValueChange } = renderWheel({ defaultValue: '2030' });
    listbox.focus();

    await user.keyboard('{ArrowDown}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('wraps past the end when it does', async () => {
    const user = userEvent.setup();
    const { listbox, onValueChange } = renderWheel({ defaultValue: '2030', loop: true });
    listbox.focus();

    await user.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenLastCalledWith('1990');
  });

  describe('a disabled row', () => {
    const withGap: WheelItem[] = [
      { value: '2019', label: '2019' },
      { value: '2020', label: '2020', disabled: true },
      { value: '2021', label: '2021' },
    ];

    it('is announced as disabled and cannot be chosen', async () => {
      const user = userEvent.setup();
      const { onValueChange } = renderWheel({ items: withGap, defaultValue: '2019' });

      const blocked = screen.getByRole('option', { name: '2020' });
      expect(blocked).toHaveAttribute('aria-disabled', 'true');
      await user.click(blocked);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('is stepped OVER by the keyboard rather than landed on', async () => {
      const user = userEvent.setup();
      const { listbox, onValueChange } = renderWheel({ items: withGap, defaultValue: '2019' });
      listbox.focus();

      await user.keyboard('{ArrowDown}');
      expect(onValueChange).toHaveBeenLastCalledWith('2021');
    });
  });

  it('leaves the tab order and refuses every input when disabled', async () => {
    const user = userEvent.setup();
    const { listbox, onValueChange } = renderWheel({ disabled: true });

    expect(listbox).toHaveAttribute('aria-disabled', 'true');
    expect(listbox).toHaveAttribute('tabindex', '-1');

    await user.click(screen.getByRole('option', { name: '2023' }));
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('follows a controlled value instead of its own state', () => {
    const { rerender } = render(<Wheel label="Year" items={YEARS} value="2018" />);
    expect(screen.getByRole('option', { name: '2018' })).toHaveAttribute('aria-selected', 'true');

    rerender(<Wheel label="Year" items={YEARS} value="2022" />);
    expect(screen.getByRole('option', { name: '2018' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: '2022' })).toHaveAttribute('aria-selected', 'true');
  });
});
