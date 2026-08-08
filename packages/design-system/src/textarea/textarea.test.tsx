import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('types uncontrolled and reports every change', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea aria-label="Log entry" onValueChange={onValueChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Log entry' }), 'Jump complete');

    expect(screen.getByRole('textbox', { name: 'Log entry' })).toHaveValue('Jump complete');
    expect(onValueChange).toHaveBeenLastCalledWith('Jump complete');
  });

  it('renders the requested number of rows', () => {
    render(<Textarea aria-label="Log entry" rows={6} />);

    expect(screen.getByRole('textbox', { name: 'Log entry' })).toHaveAttribute('rows', '6');
  });

  it('takes id, name, description and invalid state from a surrounding Field', () => {
    render(
      <Field.Root name="log" invalid>
        <Field.Label>Log entry</Field.Label>
        <Textarea />
        <Field.Error>Say something</Field.Error>
      </Field.Root>,
    );

    const textarea = screen.getByRole('textbox', { name: 'Log entry' });
    expect(textarea).toHaveAttribute('name', 'log');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Say something');
  });

  it('allows vertical resizing only', () => {
    // Horizontal resizing breaks the form's column and has no native
    // counterpart, so it must not be reachable by dragging.
    render(<Textarea aria-label="Log entry" data-testid="textarea" />);

    expect(screen.getByTestId('textarea')).toHaveClass('resize-y');
  });
});
