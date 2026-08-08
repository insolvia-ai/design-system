// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// This leaf carries real a11y wiring (the live-region role, the named dismiss
// control), which is exactly the case the package CLAUDE.md says owes a native
// test: Field's label wiring shipped broken in 0.2.1 because only `.web` was
// tested.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Alert } from './alert';
import { DEFAULT_DISMISS_LABEL } from './alert.props';

describe('Alert (native leaf)', () => {
  it('puts the same live-region role on the box as the web leaf', () => {
    render(
      <Alert.Root intent="danger">
        <Alert.Title>Jump aborted</Alert.Title>
      </Alert.Root>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('stays polite for informational intents', () => {
    render(
      <Alert.Root intent="info">
        <Alert.Title>Heads up</Alert.Title>
      </Alert.Root>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('calls onDismiss from a control that carries an accessible name', async () => {
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

  it('resolves title colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(
      <Alert.Root intent="info">
        <Alert.Title>Dark title</Alert.Title>
      </Alert.Root>,
    );

    expect(rgb(getComputedStyle(screen.getByText('Dark title')).color)).toEqual(
      rgb(colors.dark.ink),
    );
  });
});
