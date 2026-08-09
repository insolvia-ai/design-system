// NATIVE-leaf tests, run in the vitest `native` project. The leaf carries the
// group's a11y wiring and its Field association, and a React Native consumer
// never renders the `.web` leaf — so a break here would be invisible to every
// test in the other project. The Field label wiring shipped broken in 0.2.1 for
// exactly that reason.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Field } from '../field';
import { DatePicker } from './date-picker';

function column(name: string) {
  return within(screen.getByRole('listbox', { name }));
}

function selectedIn(name: string): string {
  const chosen = column(name)
    .getAllByRole('option')
    .find((option) => option.getAttribute('aria-selected') === 'true');
  return chosen?.textContent ?? '';
}

describe('DatePicker (native leaf)', () => {
  it('emits a named group of columns', () => {
    render(<DatePicker defaultValue="2026-03-11" today="2026-03-11" />);
    expect(screen.getByRole('group', { name: 'Date' })).toBeTruthy();
    expect(selectedIn('Day')).toBe('11');
    expect(selectedIn('Month')).toBe('Mar');
    expect(selectedIn('Year')).toBe('2026');
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

  it('clamps a day the new month does not have', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker defaultValue="2026-01-31" today="2026-01-31" onValueChange={onValueChange} />,
    );

    await user.click(column('Month').getByRole('option', { name: 'Feb' }));
    expect(onValueChange).toHaveBeenLastCalledWith('2026-02-28');
  });

  it('reads the whole selection out', () => {
    render(<DatePicker mode="datetime" defaultValue="2026-03-11T09:30" />);
    expect(screen.getByText('11 Mar 2026, 09:30')).toBeTruthy();
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

  it('resolves the card at RENDER time, so it follows the scheme', () => {
    // 0.2.1 shipped every native leaf reading `colors.light` at module load,
    // and every surface stayed light inside a dark app.
    setPrefersColorScheme('dark');
    render(<DatePicker defaultValue="2026-03-11" />);

    const group = screen.getByRole('group', { name: 'Date' });
    expect(rgb(getComputedStyle(group).backgroundColor)).toEqual(rgb(colors.dark.card));
  });
});
