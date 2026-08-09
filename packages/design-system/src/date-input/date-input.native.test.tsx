// NATIVE-leaf tests, run in the vitest `native` project. This leaf carries the
// Field association AND the `controlOpen` handshake that keeps an open picker
// from painting underneath the form below it — the 0.7.1 bug, which every test
// in this package passed while it was shipping.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Field } from '../field';
import { DateInput } from './date-input';

describe('DateInput (native leaf)', () => {
  it('emits a text field and a button that names the mode', () => {
    render(<DateInput aria-label="Date of birth" />);
    expect(screen.getByRole('textbox', { name: 'Date of birth' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose a date' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('masks as the user types', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateInput aria-label="Date" onValueChange={onValueChange} />);

    await user.type(screen.getByRole('textbox'), '20190214');
    expect(screen.getByRole('textbox')).toHaveValue('2019-02-14');
    expect(onValueChange).toHaveBeenLastCalledWith('2019-02-14', 'valid');
  });

  it('opens the picker on the button and writes a pick back into the field', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateInput aria-label="Date" today="2026-03-11" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Choose a date' }));
    const picker = within(screen.getByRole('dialog'));
    expect(picker.getByText('11 Mar 2026')).toBeTruthy();

    await user.click(
      within(picker.getByRole('listbox', { name: 'Day' })).getByRole('option', { name: '19' }),
    );
    expect(onValueChange).toHaveBeenLastCalledWith('2026-03-19', 'valid');
    expect(screen.getByRole('textbox')).toHaveValue('2026-03-19');
  });

  it('tells an enclosing Field its picker is open, so the Field can elevate itself', async () => {
    // React Native gives every View its own stacking context, so this leaf's
    // own zIndex can only order it against ITS siblings — never past the Field
    // wrapping it. Without this handshake the open picker paints underneath
    // whatever follows the Field, which is exactly 0.7.1.
    const user = userEvent.setup();
    render(
      <Field.Root>
        <Field.Label>Starts</Field.Label>
        <DateInput today="2026-03-11" />
      </Field.Root>,
    );

    const fieldRoot = screen.getByText('Starts').parentElement as HTMLElement;
    const zBefore = getComputedStyle(fieldRoot).zIndex;

    await user.click(screen.getByRole('button', { name: 'Choose a date' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(getComputedStyle(fieldRoot).zIndex).not.toBe(zBefore);
  });

  it('takes its name and invalid state from an enclosing Field', () => {
    render(
      <Field.Root name="dob" invalid>
        <Field.Label>Date of birth</Field.Label>
        <DateInput />
        <Field.Error>Pick a date</Field.Error>
      </Field.Root>,
    );

    const field = screen.getByRole('textbox', { name: 'Date of birth' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('resolves its border at RENDER time, so it follows the scheme', () => {
    // 0.2.1 shipped every native leaf reading `colors.light` at module load,
    // and every surface stayed light inside a dark app.
    setPrefersColorScheme('dark');
    render(<DateInput aria-label="Date" />);
    expect(rgb(getComputedStyle(screen.getByRole('textbox')).borderTopColor)).toEqual(
      rgb(colors.dark.line),
    );
  });
});
