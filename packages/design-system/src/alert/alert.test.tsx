import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './alert';
import { DEFAULT_DISMISS_LABEL } from './alert.props';

describe('Alert', () => {
  it('renders a polite status region for informational intents', () => {
    render(
      <Alert.Root intent="success">
        <Alert.Title>Jump logged</Alert.Title>
        <Alert.Description>The nav computer stored the solution.</Alert.Description>
      </Alert.Root>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Jump logged')).toBeInTheDocument();
  });

  it('renders an assertive alert region for danger', () => {
    render(
      <Alert.Root intent="danger">
        <Alert.Title>Jump aborted</Alert.Title>
      </Alert.Root>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onDismiss from the corner control, which carries an accessible name', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <Alert.Root intent="info" onDismiss={onDismiss}>
        <Alert.Title>Heads up</Alert.Title>
      </Alert.Root>,
    );

    await user.click(screen.getByRole('button', { name: DEFAULT_DISMISS_LABEL }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders no dismiss affordance at all when the alert is permanent', () => {
    render(
      <Alert.Root intent="info">
        <Alert.Title>Permanent</Alert.Title>
        <Alert.Close>Dismiss</Alert.Close>
      </Alert.Root>,
    );

    // Both the corner × and the in-body Close: with no `onDismiss` there is
    // nothing either could do, and a dead button is worse than no button.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onDismiss from the in-body Close part too', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <Alert.Root intent="warning" onDismiss={onDismiss}>
        <Alert.Title>Low fuel</Alert.Title>
        <Alert.Close>Ignore</Alert.Close>
      </Alert.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Ignore' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('throws when a part is used outside its Root', () => {
    // Same contract as every other parts object here — a part that silently
    // rendered inert outside its Root would be a much harder bug to find.
    expect(() => render(<Alert.Close>Dismiss</Alert.Close>)).toThrow(
      /Alert.Close must be rendered inside/,
    );
  });
});
