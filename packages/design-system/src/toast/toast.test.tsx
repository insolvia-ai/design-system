import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Toast } from './toast';
import { DEFAULT_VIEWPORT_LABEL, useToast } from './toast.props';

function Publisher() {
  const toast = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.add({ title: 'Jump logged', duration: 0 })}>
        Log a jump
      </button>
      <button
        type="button"
        onClick={() =>
          toast.add({
            title: 'Jump aborted',
            intent: 'danger',
            description: 'Fuel too low.',
            duration: 0,
          })
        }
      >
        Abort
      </button>
    </div>
  );
}

function Example() {
  return (
    <Toast.Provider>
      <Publisher />
      <Toast.Viewport />
    </Toast.Provider>
  );
}

describe('Toast', () => {
  it('publishes a toast into a named region', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));

    const region = screen.getByRole('region', { name: DEFAULT_VIEWPORT_LABEL });
    expect(region).toBeInTheDocument();
    expect(screen.getByText('Jump logged')).toBeInTheDocument();
  });

  it('puts the live-region role on the TOAST, not on the viewport', async () => {
    // A region that announced its own arrival would repeat every message
    // twice. `status` for the polite intents, `alert` for the loud ones — the
    // rule shared with Alert.
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));
    expect(screen.getByRole('status')).toHaveTextContent('Jump logged');

    await user.click(screen.getByRole('button', { name: 'Abort' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Jump aborted');
  });

  it('renders a description when one is given', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Abort' }));

    expect(screen.getByText('Fuel too low.')).toBeInTheDocument();
  });

  it('dismisses from the toast’s own control', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('Jump logged')).not.toBeInTheDocument();
  });

  it('stacks several at once', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));
    await user.click(screen.getByRole('button', { name: 'Abort' }));

    expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(2);
  });

  it('throws when useToast is called outside a Provider', () => {
    // A toast that silently never appears is the kind of bug that survives to
    // production, because the call site looks fine.
    expect(() => render(<Publisher />)).toThrow(/useToast\(\) must be called inside/);
  });

  it('keeps the viewport click-through so it cannot swallow the page', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));

    // A fixed strip across the corner that captured presses would break
    // whatever sits under it for as long as the app runs.
    expect(screen.getByRole('region', { name: DEFAULT_VIEWPORT_LABEL })).toHaveClass(
      'pointer-events-none',
    );
  });
});
