// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Toast } from './toast';
import { DEFAULT_VIEWPORT_LABEL, useToast } from './toast.props';

function Publisher() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.add({ title: 'Jump logged', duration: 0 })}>
      Log a jump
    </button>
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

describe('Toast (native leaf)', () => {
  it('publishes into a named region with the same live-region role as the web leaf', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));

    expect(screen.getByRole('region', { name: DEFAULT_VIEWPORT_LABEL })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Jump logged');
  });

  it('dismisses from the toast’s own control', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('Jump logged')).not.toBeInTheDocument();
  });

  it('resolves the title colour from the ACTIVE scheme, not module load', async () => {
    setPrefersColorScheme('dark');
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Log a jump' }));

    expect(rgb(getComputedStyle(screen.getByText('Jump logged')).color)).toEqual(
      rgb(colors.dark.ink),
    );
  });
});
