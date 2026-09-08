import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { PinInput } from './pin-input';

describe('PinInput', () => {
  it('renders `length` boxes, each labelled with its position', () => {
    render(<PinInput length={4} />);

    const group = screen.getByRole('group', { name: 'Verification code' });
    expect(within(group).getAllByRole('textbox')).toHaveLength(4);
    expect(screen.getByLabelText('Digit 1 of 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Digit 4 of 4')).toBeInTheDocument();
  });

  it('advances box to box while typing, reporting every change', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<PinInput length={4} onValueChange={onValueChange} />);

    await user.click(screen.getByLabelText('Digit 1 of 4'));
    await user.keyboard('123');

    expect(onValueChange).toHaveBeenLastCalledWith('123');
    expect(screen.getByLabelText('Digit 4 of 4')).toHaveFocus();
    expect(screen.getByLabelText('Digit 3 of 4')).toHaveValue('3');
  });

  it('fires onComplete exactly once, with the full code', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<PinInput length={4} onComplete={onComplete} />);

    await user.click(screen.getByLabelText('Digit 1 of 4'));
    await user.keyboard('1234');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('Backspace on an empty box moves back and clears the previous one', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<PinInput length={4} onValueChange={onValueChange} />);

    await user.click(screen.getByLabelText('Digit 1 of 4'));
    await user.keyboard('12');
    // Focus is now on the empty third box; nothing to delete there.
    await user.keyboard('{Backspace}');

    expect(onValueChange).toHaveBeenLastCalledWith('1');
    expect(screen.getByLabelText('Digit 2 of 4')).toHaveFocus();
    expect(screen.getByLabelText('Digit 2 of 4')).toHaveValue('');
  });

  it('distributes a paste across the boxes from the focused one', () => {
    const onValueChange = vi.fn();
    render(<PinInput length={6} onValueChange={onValueChange} />);

    fireEvent.paste(screen.getByLabelText('Digit 1 of 6'), {
      clipboardData: { getData: () => '123456' },
    });

    expect(onValueChange).toHaveBeenLastCalledWith('123456');
    expect(screen.getByLabelText('Digit 1 of 6')).toHaveValue('1');
    expect(screen.getByLabelText('Digit 6 of 6')).toHaveValue('6');
  });

  it('numeric type rejects a letter', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<PinInput length={4} type="numeric" onValueChange={onValueChange} />);

    await user.click(screen.getByLabelText('Digit 1 of 4'));
    await user.keyboard('a');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Digit 1 of 4')).toHaveValue('');
  });

  it('is invalid on its own, outside a Field', () => {
    render(<PinInput length={3} invalid label="Own code" />);

    within(screen.getByRole('group', { name: 'Own code' }))
      .getAllByRole('textbox')
      .forEach((box) => {
        expect(box).toHaveAttribute('aria-invalid', 'true');
      });
  });

  it('merges invalid from a surrounding Field', () => {
    render(
      <Field.Root invalid>
        <PinInput length={3} label="Field code" />
      </Field.Root>,
    );

    within(screen.getByRole('group', { name: 'Field code' }))
      .getAllByRole('textbox')
      .forEach((box) => {
        expect(box).toHaveAttribute('aria-invalid', 'true');
      });
  });

  it('carries the joined value on a hidden `name` input for form submission', () => {
    const { container } = render(<PinInput length={4} name="code" defaultValue="12" />);

    const hidden = container.querySelector('input[type="hidden"][name="code"]');
    expect(hidden).toHaveValue('12');
  });

  it('renders no hidden input when `name` is omitted', () => {
    const { container } = render(<PinInput length={4} />);

    expect(container.querySelector('input[type="hidden"]')).not.toBeInTheDocument();
  });
});
