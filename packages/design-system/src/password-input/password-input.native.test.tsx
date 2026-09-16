// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The toggle carries the a11y wiring the web leaf gets from a real ARIA
// `aria-pressed` attribute on a `<button>` — the native leaf can only speak
// it through `accessibilityState.selected` under react-native-web, so that
// direction is worth pinning here rather than inferring from the web tests.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { PasswordInput } from './password-input';

describe('PasswordInput (native leaf)', () => {
  it('starts secureTextEntry and flips it on a press of the toggle', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" />);

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    // react-native-web renders `secureTextEntry` as `type="password"` on the
    // underlying DOM node — the same signal the web leaf's own type flips.
    // Revealed drops the attribute entirely rather than setting it to
    // `"text"` explicitly, so the property (which the DOM normalises to
    // `"text"` either way) is what both states are asserted against.
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(input.type).toBe('text');
  });

  it('calls onRevealedChange when the toggle is pressed', async () => {
    const onRevealedChange = vi.fn();
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" onRevealedChange={onRevealedChange} />);

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(onRevealedChange).toHaveBeenCalledTimes(1);
    expect(onRevealedChange).toHaveBeenCalledWith(true);
  });

  it('carries the pressed state on accessibilityState.selected', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" />);

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('resolves the toggle label colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(<PasswordInput aria-label="Password" />);

    expect(rgb(getComputedStyle(screen.getByText('Show')).color)).toEqual(rgb(colors.dark.muted));
  });

  // lib/native-focus.native.ts exists because an unringed native control falls
  // through to Chrome's blue `outline-style: auto` under react-native-web. The
  // box got the fix and the toggle beside it did not, so a keyboard user
  // tabbing from the field to the toggle watched the package's ring turn into
  // the browser's halfway across one control.
  it('rings the toggle with the design system’s OWN ring, not the browser default', () => {
    setPrefersColorScheme('light');
    render(<PasswordInput aria-label="Password" />);

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(getComputedStyle(toggle).outlineWidth).not.toBe('2px');

    act(() => toggle.focus());

    const style = getComputedStyle(toggle);
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineOffset).toBe('2px');
    expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
  });

  // The reason the toggle needs its OWN `useNativeFocusRing()`: one instance
  // holds a single boolean, so sharing the field's would ring the whole box
  // whenever the toggle took focus — two rings for one focused control.
  it('rings ONLY the toggle — the box keeps its own, separate focus state', () => {
    setPrefersColorScheme('light');
    render(<PasswordInput aria-label="Password" />);

    const input = screen.getByLabelText('Password');
    const box = input.closest('div') as HTMLElement;
    const toggle = screen.getByRole('button', { name: 'Show password' });

    act(() => toggle.focus());
    expect(getComputedStyle(toggle).outlineWidth).toBe('2px');
    expect(getComputedStyle(box).outlineWidth).not.toBe('2px');

    act(() => input.focus());
    expect(getComputedStyle(box).outlineWidth).toBe('2px');
    expect(getComputedStyle(toggle).outlineWidth).not.toBe('2px');
  });

  it('resolves the box border from the active scheme too', () => {
    setPrefersColorScheme('light');
    render(<PasswordInput aria-label="Password" invalid />);

    // The row itself carries the invalid border, same as Input's box.
    const row = screen.getByLabelText('Password').closest('div');
    expect(rgb(getComputedStyle(row as HTMLElement).borderColor)).toEqual(rgb(colors.light.danger));
  });
});
