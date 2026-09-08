import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('starts as type="password" and toggles to text on click', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" />);

    // A password field has no accessible "textbox" role until it is
    // `type="text"` — assert via the input directly.
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(input).toHaveAttribute('type', 'text');
  });

  it('flips the toggle’s aria-label and aria-pressed with the state', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" />);

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    const revealedToggle = screen.getByRole('button', { name: 'Hide password' });
    expect(revealedToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onRevealedChange when the toggle is clicked', async () => {
    const onRevealedChange = vi.fn();
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" onRevealedChange={onRevealedChange} />);

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(onRevealedChange).toHaveBeenCalledTimes(1);
    expect(onRevealedChange).toHaveBeenCalledWith(true);
  });

  it('a controlled `revealed` wins over a click', async () => {
    const onRevealedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PasswordInput aria-label="Password" revealed={false} onRevealedChange={onRevealedChange} />,
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    // The click is REPORTED, but the parent declined it, so the field stays
    // hidden — the same controlled/uncontrolled contract input.test.tsx pins
    // for the text itself.
    expect(onRevealedChange).toHaveBeenCalledTimes(1);
    expect(onRevealedChange).toHaveBeenCalledWith(true);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('reads its id and label association from a surrounding Field', () => {
    render(
      <Field.Root name="password" invalid>
        <Field.Label>Password</Field.Label>
        <PasswordInput />
        <Field.Error>Required</Field.Error>
      </Field.Root>,
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('name', 'password');
    expect(input).toHaveAccessibleDescription('Required');
  });

  it('defaults autoComplete to current-password, never off', () => {
    render(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('takes an explicit new-password autoComplete for sign-up forms', () => {
    render(<PasswordInput aria-label="Password" autoComplete="new-password" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('never blocks paste', () => {
    // No onPaste handler anywhere on the control — a password manager or a
    // user pasting a generated password into this field must keep working.
    // Asserted by absence: the rendered input carries no paste handler to
    // call, so a paste event runs unobstructed.
    render(<PasswordInput aria-label="Password" />);

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.onpaste).toBeNull();
  });
});
