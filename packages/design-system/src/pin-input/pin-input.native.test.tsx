// NATIVE-leaf tests — see input.native.test.tsx for what the `native` vitest
// project resolves. This leaf carries its own a11y wiring (the hidden field's
// accessibilityLabel/Hint) and its own colour resolution for the decorative
// boxes, neither of which the web leaf's tests can see.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { PinInput } from './pin-input';

describe('PinInput (native leaf)', () => {
  it('types into the hidden field, draws the boxes from it, and reports every change', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<PinInput length={4} onValueChange={onValueChange} />);

    const hidden = screen.getByLabelText('Verification code');
    await user.type(hidden, '1234');

    expect(hidden).toHaveValue('1234');
    expect(onValueChange).toHaveBeenLastCalledWith('1234');
    // The boxes are drawn FROM the hidden field's value, not typed into
    // directly — see the file header. Distinct digits so each query is
    // unambiguous.
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('fires onComplete exactly once, with the full code', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<PinInput length={4} onComplete={onComplete} />);

    await user.type(screen.getByLabelText('Verification code'), '1234');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('resolves a filled box’s text colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(<PinInput length={4} defaultValue="12" />);

    expect(rgb(getComputedStyle(screen.getByText('1')).color)).toEqual(rgb(colors.dark.ink));
  });
});
