import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { Input } from './input';

describe('Input', () => {
  it('types uncontrolled and reports every change', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Input aria-label="Callsign" onValueChange={onValueChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Callsign' }), 'Wayfarer');

    expect(screen.getByRole('textbox', { name: 'Callsign' })).toHaveValue('Wayfarer');
    expect(onValueChange).toHaveBeenLastCalledWith('Wayfarer');
  });

  it('is controlled when `value` is given: the parent owns what shows', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Input aria-label="Callsign" value="Fixed" onValueChange={onValueChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Callsign' }), 'x');

    // The keystroke is reported but not applied — the parent declined it.
    expect(onValueChange).toHaveBeenCalledWith('Fixedx');
    expect(screen.getByRole('textbox', { name: 'Callsign' })).toHaveValue('Fixed');
  });

  it('takes its id, description and invalid state from a surrounding Field', () => {
    render(
      <Field.Root name="callsign" invalid>
        <Field.Label>Callsign</Field.Label>
        <Input />
        <Field.Error>Required</Field.Error>
      </Field.Root>,
    );

    const input = screen.getByRole('textbox', { name: 'Callsign' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('name', 'callsign');
    expect(input).toHaveAccessibleDescription('Required');
  });

  it('can be invalid on its own, outside a Field', () => {
    render(<Input aria-label="Callsign" invalid />);

    expect(screen.getByRole('textbox', { name: 'Callsign' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('maps type to the autocomplete hint both platforms share', () => {
    render(<Input aria-label="Email" type="email" />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('autocomplete', 'email');
  });

  it('applies the size scale, defaulting to the 44px target-size floor', () => {
    render(<Input aria-label="Callsign" data-testid="input" />);

    expect(screen.getByTestId('input')).toHaveClass('h-11');
  });
});
