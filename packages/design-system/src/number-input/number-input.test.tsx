import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { NumberInput } from './number-input';

describe('NumberInput', () => {
  it('renders a spinbutton with the numeric ARIA value trio', () => {
    render(<NumberInput aria-label="Quantity" defaultValue={5} min={0} max={10} />);

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveAttribute('aria-valuenow', '5');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
  });

  it('types freely, then reports the committed number on blur', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" defaultValue={1} onValueChange={onValueChange} />);

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    await user.clear(input);
    await user.type(input, '12');
    // No commit yet — typing alone never calls onValueChange.
    expect(onValueChange).not.toHaveBeenCalled();

    await user.tab();

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(12);
    expect(input).toHaveValue('12');
  });

  it('clamps on BLUR only — typing "1" on the way to "15" against min=10 is not clamped mid-keystroke', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <NumberInput
        aria-label="Quantity"
        defaultValue={null}
        min={10}
        max={20}
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    await user.type(input, '1');
    // Still "1", not clamped up to the min — no commit has happened.
    expect(input).toHaveValue('1');
    expect(onValueChange).not.toHaveBeenCalled();

    await user.type(input, '5');
    await user.tab();

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(15);
    expect(input).toHaveValue('15');
  });

  it('clamps a typed value beyond max on blur', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <NumberInput
        aria-label="Quantity"
        defaultValue={null}
        min={0}
        max={10}
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    await user.type(input, '99');
    await user.tab();

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(10);
    expect(input).toHaveValue('10');
  });

  it('the + and − buttons step and report immediately, and disable at their bound', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <NumberInput
        aria-label="Quantity"
        defaultValue={9}
        min={0}
        max={10}
        onValueChange={onValueChange}
      />,
    );

    const increment = screen.getByRole('button', { name: 'Increase' });
    const decrement = screen.getByRole('button', { name: 'Decrease' });
    expect(increment).not.toBeDisabled();

    await user.click(increment);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(10);
    expect(increment).toBeDisabled();
    expect(decrement).not.toBeDisabled();
  });

  it('ArrowUp steps by `step` and commits immediately', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <NumberInput aria-label="Quantity" defaultValue={5} step={2} onValueChange={onValueChange} />,
    );

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    input.focus();
    await user.keyboard('{ArrowUp}');

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(7);
    expect(input).toHaveValue('7');
  });

  it('can be invalid on its own, outside a Field', () => {
    render(<NumberInput aria-label="Quantity" invalid />);

    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('reads its label, id and invalid state from a surrounding Field', () => {
    render(
      <Field.Root name="quantity" invalid>
        <Field.Label>Quantity</Field.Label>
        <NumberInput />
        <Field.Error>Required</Field.Error>
      </Field.Root>,
    );

    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('name', 'quantity');
    expect(input).toHaveAccessibleDescription('Required');
  });
});
