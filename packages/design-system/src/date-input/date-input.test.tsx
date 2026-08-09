// Behavioural tests for the WEB leaf: the field, the button, and the picker it
// opens. The wheels themselves are DatePicker's tests; what is asserted here is
// the seam — that typing and picking are two routes to one value.
import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field';
import { DateInput } from './date-input.web';

const openPicker = async (user: ReturnType<typeof userEvent.setup>, name = 'Choose a date') => {
  await user.click(screen.getByRole('button', { name }));
  return within(screen.getByRole('dialog'));
};

describe('DateInput', () => {
  it('shows the mode’s format as its placeholder', () => {
    const { rerender } = render(<DateInput />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'YYYY-MM-DD');

    rerender(<DateInput mode="time" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'HH:mm');

    rerender(<DateInput mode="datetime" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'YYYY-MM-DD HH:mm');
  });

  describe('which picker the button opens', () => {
    it('opens the wheels by default', async () => {
      const user = userEvent.setup();
      render(<DateInput today="2026-03-11" />);
      const picker = await openPicker(user);
      expect(picker.getByRole('listbox', { name: 'Day' })).toBeInTheDocument();
      expect(picker.queryByRole('grid')).toBeNull();
    });

    it('opens the month grid when asked', async () => {
      const user = userEvent.setup();
      render(<DateInput today="2026-03-11" picker="calendar" />);
      const picker = await openPicker(user);
      expect(picker.getByRole('grid')).toBeInTheDocument();
      expect(picker.queryByRole('listbox', { name: 'Day' })).toBeNull();
    });

    it('never shows BOTH — they are alternatives, not toggles', async () => {
      const user = userEvent.setup();
      for (const choice of ['wheels', 'calendar'] as const) {
        const view = render(<DateInput today="2026-03-11" picker={choice} />);
        const picker = await openPicker(user);
        const wheels = picker.queryAllByRole('listbox').length > 0;
        const grid = picker.queryByRole('grid') !== null;
        expect(wheels).toBe(!grid);
        view.unmount();
      }
    });

    it('writes a grid pick back into the field', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<DateInput today="2026-03-11" picker="calendar" onValueChange={onValueChange} />);

      const picker = await openPicker(user);
      await user.click(picker.getByRole('button', { name: '19 March 2026' }));
      expect(onValueChange).toHaveBeenLastCalledWith('2026-03-19', 'valid');
      expect(screen.getByRole('textbox')).toHaveValue('2026-03-19');
    });

    it('falls back to the wheels for a mode the grid cannot express', async () => {
      // A month grid has no hours in it. Returned rather than thrown: `mode`
      // and `picker` are independent props and flipping the mode of a
      // calendar-configured field is an ordinary thing to do.
      const user = userEvent.setup();
      render(<DateInput mode="time" picker="calendar" defaultValue="09:30" />);
      const picker = await openPicker(user, 'Choose a time');
      expect(picker.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
      expect(picker.queryByRole('grid')).toBeNull();
    });
  });

  describe('a caller-chosen format', () => {
    it('shows the format as the placeholder and types in its order', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<DateInput format="MM/DD/YYYY" onValueChange={onValueChange} />);

      const field = screen.getByRole('textbox');
      expect(field).toHaveAttribute('placeholder', 'MM/DD/YYYY');

      await user.type(field, '02142019');
      expect(field).toHaveValue('02/14/2019');
      // Displayed month-first, STORED as ISO — which is what keeps one value
      // type behind two conventions.
      expect(onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
    });

    it('prints a controlled value in the display order', () => {
      render(<DateInput format="DD.MM.YYYY" value="2019-02-14" />);
      expect(screen.getByRole('textbox')).toHaveValue('14.02.2019');
    });

    it('writes a picked value back in the display order too', async () => {
      const user = userEvent.setup();
      render(<DateInput format="MM/DD/YYYY" today="2026-03-11" />);

      const picker = await openPicker(user);
      await user.click(
        within(picker.getByRole('listbox', { name: 'Day' })).getByRole('option', { name: '19' }),
      );
      expect(screen.getByRole('textbox')).toHaveValue('03/19/2026');
    });

    it('re-prints what is already typed when the format changes, rather than dropping it', () => {
      // A form that switches convention must not clear the user's work: the
      // digits are the same digits, only their order moves.
      const { rerender } = render(<DateInput defaultValue="2019-02-14" />);
      expect(screen.getByRole('textbox')).toHaveValue('2019-02-14');

      rerender(<DateInput defaultValue="2019-02-14" format="MM/DD/YYYY" />);
      expect(screen.getByRole('textbox')).toHaveValue('02/14/2019');
    });

    it('throws on a format that does not fit the mode', () => {
      // Static prop, so this lands the first time it renders in development.
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(() => render(<DateInput format="MM/DD" />)).toThrow(/does not fit mode "date"/);
      quiet.mockRestore();
    });
  });

  it('masks as the user types', async () => {
    const user = userEvent.setup();
    render(<DateInput />);
    const field = screen.getByRole('textbox');

    await user.type(field, '20190214');
    expect(field).toHaveValue('2019-02-14');
  });

  describe('onValueChange', () => {
    it('reports a complete, real, in-range value', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<DateInput onValueChange={onValueChange} />);

      await user.type(screen.getByRole('textbox'), '20190214');
      expect(onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
    });

    it('distinguishes "still typing" from "cleared", which is the whole reason for the second argument', async () => {
      // A caller that autosaves cannot tell them apart from the value alone,
      // and treating "still typing" as "cleared" wipes a saved date the moment
      // someone edits it.
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<DateInput defaultValue="2020-01-15" onValueChange={onValueChange} />);

      await user.type(screen.getByRole('textbox'), '{Backspace}');
      expect(onValueChange).toHaveBeenLastCalledWith('', 'incomplete');

      await user.clear(screen.getByRole('textbox'));
      expect(onValueChange).toHaveBeenLastCalledWith('', 'empty');
    });

    it('reports an impossible date as invalid rather than rolling it over', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<DateInput onValueChange={onValueChange} />);

      await user.type(screen.getByRole('textbox'), '20190230');
      expect(onValueChange).toHaveBeenLastCalledWith('', 'invalid');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does NOT mark a half-typed entry as an error', async () => {
      const user = userEvent.setup();
      render(<DateInput />);
      await user.type(screen.getByRole('textbox'), '2019');
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('the picker the button opens', () => {
    it('is closed until the button is pressed', async () => {
      const user = userEvent.setup();
      render(<DateInput today="2026-03-11" />);
      expect(screen.queryByRole('dialog')).toBeNull();

      const button = screen.getByRole('button', { name: 'Choose a date' });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      await openPicker(user);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens on TODAY when the field is empty, not on a fixed fallback date', async () => {
      const user = userEvent.setup();
      render(<DateInput today="2026-03-11" />);
      const picker = await openPicker(user);
      expect(picker.getByText('11 Mar 2026')).toBeInTheDocument();
    });

    it('opens on the typed value when there is one', async () => {
      const user = userEvent.setup();
      render(<DateInput today="2026-03-11" defaultValue="2019-02-14" />);
      const picker = await openPicker(user);
      expect(picker.getByText('14 Feb 2019')).toBeInTheDocument();
    });

    it('writes a picked value back into the field', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<DateInput today="2026-03-11" onValueChange={onValueChange} />);

      const picker = await openPicker(user);
      await user.click(
        within(picker.getByRole('listbox', { name: 'Day' })).getByRole('option', { name: '19' }),
      );

      expect(onValueChange).toHaveBeenLastCalledWith('2026-03-19', 'valid');
      expect(screen.getByRole('textbox')).toHaveValue('2026-03-19');
    });

    it('follows the field when a complete date is typed', async () => {
      const user = userEvent.setup();
      render(<DateInput today="2026-03-11" />);
      await user.type(screen.getByRole('textbox'), '20190214');

      const picker = await openPicker(user);
      expect(picker.getByText('14 Feb 2019')).toBeInTheDocument();
    });

    it('closes on Escape, which the ROOT hears because focus never left the field', async () => {
      // Opening the picker does not move focus, so a handler bound to the
      // surface would never see the keystroke.
      const user = userEvent.setup();
      render(<DateInput today="2026-03-11" />);
      await openPicker(user);

      screen.getByRole('textbox').focus();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('closes on a press outside', async () => {
      const user = userEvent.setup();
      render(
        <>
          <DateInput today="2026-03-11" />
          <button type="button">Elsewhere</button>
        </>,
      );
      await openPicker(user);

      await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('names the button and the surface for the mode', async () => {
      const user = userEvent.setup();
      render(<DateInput mode="time" defaultValue="09:30" />);
      const picker = await openPicker(user, 'Choose a time');
      expect(picker.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
      expect(screen.queryByRole('listbox', { name: 'Day' })).toBeNull();
    });
  });

  it('posts the complete value and never a half-typed one', async () => {
    const user = userEvent.setup();
    const { container } = render(<DateInput name="dob" />);
    const hidden = () => container.querySelector('input[type="hidden"]');

    await user.type(screen.getByRole('textbox'), '2019');
    expect(hidden()).toHaveValue('');

    await user.type(screen.getByRole('textbox'), '0214');
    expect(hidden()).toHaveValue('2019-02-14');
  });

  it('takes its id, name and invalid state from an enclosing Field', () => {
    render(
      <Field.Root name="dob" invalid>
        <Field.Label>Date of birth</Field.Label>
        <DateInput />
        <Field.Error>Pick a date</Field.Error>
      </Field.Root>,
    );

    const field = screen.getByLabelText('Date of birth');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('follows a controlled value instead of its own state', () => {
    const { rerender } = render(<DateInput value="2019-02-14" />);
    expect(screen.getByRole('textbox')).toHaveValue('2019-02-14');

    rerender(<DateInput value="2020-01-15" />);
    expect(screen.getByRole('textbox')).toHaveValue('2020-01-15');
  });

  it('refuses both routes when disabled', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateInput disabled onValueChange={onValueChange} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choose a date' })).toBeDisabled();
    await user.type(screen.getByRole('textbox'), '2019');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
