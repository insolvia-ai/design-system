// NATIVE-leaf tests — see slider.native.test.tsx for what the `native` vitest
// project resolves and why assertions read `aria-*` rather than
// `accessibilityValue`: react-native-web ignores the nested object.
//
// React Native 0.86's `role` prop (typed `Role`) includes `spinbutton`, and
// react-native-web renders it verbatim, so the field reports DOM
// `role="spinbutton"` here — the same role the WEB leaf
// (number-input.web.tsx) sets directly. The increment/decrement gesture
// VoiceOver/TalkBack actually drive is carried separately by
// `accessibilityActions`/`onAccessibilityAction` (the same pair
// `slider.native.tsx` uses), independent of this role.
//
// `onAccessibilityAction` itself is NOT exercised here, for the same reason
// `slider.native.test.tsx` leaves its gesture untested: react-native-web has
// no DOM event that reaches it at all (grep the package — there is no
// `accessibilityActions` handling in it), so a test that dispatched one would
// only prove a fake event fires a fake listener. What the increment/decrement
// action calls — `state.stepBy` — is the same function the + / − buttons call
// and the same arithmetic `stepValue` runs, both covered below and in
// `number-input.props.test.ts`.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { NumberInput } from './number-input';

describe('NumberInput (native leaf)', () => {
  it('announces its value and range through the aria-* trio', () => {
    render(<NumberInput aria-label="Quantity" defaultValue={5} min={0} max={10} />);

    const field = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(field).toHaveAttribute('aria-valuenow', '5');
    expect(field).toHaveAttribute('aria-valuemin', '0');
    expect(field).toHaveAttribute('aria-valuemax', '10');
  });

  it('omits aria-valuenow entirely when empty, rather than announcing 0', () => {
    render(<NumberInput aria-label="Quantity" defaultValue={null} />);

    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).not.toHaveAttribute(
      'aria-valuenow',
    );
  });

  it('pressing the + button steps, clamps, and reports immediately', async () => {
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
    await user.click(increment);

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(10);
    expect(increment).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks a disabled field', () => {
    render(<NumberInput aria-label="Quantity" disabled />);

    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('resolves the stepper glyph colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(<NumberInput aria-label="Quantity" defaultValue={5} />);

    expect(rgb(getComputedStyle(screen.getByText('+')).color)).toEqual(rgb(colors.dark.ink));
  });
});
