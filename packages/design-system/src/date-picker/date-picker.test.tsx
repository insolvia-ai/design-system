// Behavioural tests for the WEB leaf. Driven by keyboard and clicks — see the
// note at the top of wheel.test.tsx for why nothing here scrolls.
import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field';
import { DatePicker } from './date-picker.web';

/** The column with this accessible name. Every assertion below scopes through it. */
function column(name: string) {
  return within(screen.getByRole('listbox', { name }));
}

/** The row currently selected in a column — what the wheel is showing. */
function selectedIn(name: string): string {
  const chosen = column(name)
    .getAllByRole('option')
    .find((option) => option.getAttribute('aria-selected') === 'true');
  return chosen?.textContent ?? '';
}

describe('DatePicker', () => {
  it('shows a day, month and year column in date mode', () => {
    render(<DatePicker defaultValue="2026-03-11" today="2026-03-11" />);
    expect(screen.getByRole('group', { name: 'Date' })).toBeInTheDocument();
    expect(selectedIn('Day')).toBe('11');
    expect(selectedIn('Month')).toBe('Mar');
    expect(selectedIn('Year')).toBe('2026');
    expect(screen.queryByRole('listbox', { name: 'Hour' })).toBeNull();
  });

  it('shows only the clock in time mode', () => {
    render(<DatePicker mode="time" defaultValue="09:30" />);
    expect(selectedIn('Hour')).toBe('09');
    expect(selectedIn('Minute')).toBe('30');
    expect(screen.queryByRole('listbox', { name: 'Day' })).toBeNull();
  });

  it('shows both, in date-then-time order, in datetime mode', () => {
    render(<DatePicker mode="datetime" defaultValue="2026-03-11T09:30" />);
    const names = screen
      .getAllByRole('listbox')
      .map((listbox) => listbox.getAttribute('aria-label'));
    expect(names).toEqual(['Day', 'Month', 'Year', 'Hour', 'Minute']);
  });

  it('reads the whole selection out, which no single column does', () => {
    render(<DatePicker mode="datetime" defaultValue="2026-03-11T09:30" />);
    expect(screen.getByText('11 Mar 2026, 09:30')).toBeInTheDocument();
  });

  it('composes one value out of the column that moved', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker defaultValue="2026-03-11" today="2026-03-11" onValueChange={onValueChange} />,
    );

    await user.click(column('Day').getByRole('option', { name: '19' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('2026-03-19');
  });

  describe('the day column is derived, not fixed at 31', () => {
    it('offers only the days a month actually has', async () => {
      const user = userEvent.setup();
      render(<DatePicker defaultValue="2026-01-15" today="2026-01-15" />);
      expect(column('Day').getAllByRole('option')).toHaveLength(31);

      await user.click(column('Month').getByRole('option', { name: 'Feb' }));
      expect(column('Day').getAllByRole('option')).toHaveLength(28);
    });

    it('finds the extra day in a leap February', async () => {
      const user = userEvent.setup();
      render(<DatePicker defaultValue="2024-01-15" today="2024-01-15" />);
      await user.click(column('Month').getByRole('option', { name: 'Feb' }));
      expect(column('Day').getAllByRole('option')).toHaveLength(29);
    });

    it('CLAMPS a day the new month does not have rather than rolling over', async () => {
      // 31 January plus a switch to February is the 28th, not 3 March.
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <DatePicker defaultValue="2026-01-31" today="2026-01-31" onValueChange={onValueChange} />,
      );

      await user.click(column('Month').getByRole('option', { name: 'Feb' }));
      expect(onValueChange).toHaveBeenLastCalledWith('2026-02-28');
      expect(selectedIn('Day')).toBe('28');
    });
  });

  describe('min and max', () => {
    it('strikes out the days before min in the month that contains it', () => {
      render(<DatePicker defaultValue="2026-03-20" min="2026-03-15" max="2026-05-31" />);
      const days = column('Day');
      expect(days.getByRole('option', { name: '14' })).toHaveAttribute('aria-disabled', 'true');
      expect(days.getByRole('option', { name: '15' })).not.toHaveAttribute('aria-disabled');
    });

    it('allows a month that is only PARTLY in range', () => {
      // The question is never "is this row in range" but "can any date with
      // this row selected be in range" — March is reachable when the earliest
      // allowed date is the 15th of it.
      render(<DatePicker defaultValue="2026-03-20" min="2026-03-15" max="2026-05-31" />);
      expect(column('Month').getByRole('option', { name: 'Mar' })).not.toHaveAttribute(
        'aria-disabled',
      );
      expect(column('Month').getByRole('option', { name: 'Feb' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('pulls the value inside the window when a legal column lands outside it', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <DatePicker
          defaultValue="2026-04-02"
          min="2026-03-15"
          max="2026-05-31"
          onValueChange={onValueChange}
        />,
      );

      // March is selectable, but the 2nd of it is not — so it lands on the
      // earliest date that is.
      await user.click(column('Month').getByRole('option', { name: 'Mar' }));
      expect(onValueChange).toHaveBeenLastCalledWith('2026-03-15');
    });

    it('bounds the year column by min and max when they are given', () => {
      render(<DatePicker defaultValue="2026-03-11" min="2025-01-01" max="2027-12-31" />);
      const labels = column('Year')
        .getAllByRole('option')
        .map((option) => option.textContent);
      expect(labels).toEqual(['2025', '2026', '2027']);
    });
  });

  describe('the clock', () => {
    it('steps the minute column by minuteInterval', () => {
      render(<DatePicker mode="time" defaultValue="09:00" minuteInterval={15} />);
      const labels = column('Minute')
        .getAllByRole('option')
        .map((option) => option.textContent);
      expect(labels).toEqual(['00', '15', '30', '45']);
    });

    it('snaps a minute the interval does not have DOWN to one it does', () => {
      // Never forward: a picker must not show a later time than it was given.
      render(<DatePicker mode="time" defaultValue="09:07" minuteInterval={15} />);
      expect(selectedIn('Minute')).toBe('00');
    });

    it('adds an AM/PM column on a 12-hour cycle but still stores 24-hour', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <DatePicker
          mode="time"
          defaultValue="09:30"
          hourCycle={12}
          onValueChange={onValueChange}
        />,
      );

      expect(selectedIn('Hour')).toBe('9');
      expect(selectedIn('AM or PM')).toBe('AM');

      await user.click(column('AM or PM').getByRole('option', { name: 'PM' }));
      expect(onValueChange).toHaveBeenLastCalledWith('21:30');
    });
  });

  it('posts ONE composed value, not six fragments', () => {
    const { container } = render(
      <DatePicker mode="datetime" defaultValue="2026-03-11T09:30" name="starts" />,
    );
    const hidden = container.querySelector('input[type="hidden"]');
    expect(hidden).toHaveAttribute('name', 'starts');
    expect(hidden).toHaveValue('2026-03-11T09:30');
    // The wheels themselves carry no name: a half-composed post is worse than
    // no post at all.
    expect(container.querySelectorAll('input')).toHaveLength(1);
  });

  it('takes its name and its invalid state from an enclosing Field', () => {
    render(
      <Field.Root name="dob" invalid>
        <Field.Label>Date of birth</Field.Label>
        <DatePicker defaultValue="1990-06-01" />
        <Field.Error>Pick a date</Field.Error>
      </Field.Root>,
    );

    const group = screen.getByRole('group', { name: 'Date of birth' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('follows a controlled value instead of its own state', () => {
    const { rerender } = render(<DatePicker value="2026-03-11" />);
    expect(selectedIn('Day')).toBe('11');

    rerender(<DatePicker value="2026-03-19" />);
    expect(selectedIn('Day')).toBe('19');
  });

  it('refuses every column when disabled', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue="2026-03-11" disabled onValueChange={onValueChange} />);

    for (const listbox of screen.getAllByRole('listbox')) {
      expect(listbox).toHaveAttribute('aria-disabled', 'true');
    }
    await user.click(column('Day').getByRole('option', { name: '19' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
