// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// This leaf carries the a11y wiring that the web leaf gets from the platform:
// there is no `<label for>` here, so the control points BACK at the label with
// `aria-labelledby`, and that direction is exactly what shipped broken in
// 0.2.1 for Field.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Field } from '../field/field';
import { Input } from './input';

describe('Input (native leaf)', () => {
  it('types and reports every change', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Input aria-label="Callsign" onValueChange={onValueChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Callsign' }), 'Way');

    expect(onValueChange).toHaveBeenLastCalledWith('Way');
  });

  it('is named by a surrounding Field label', () => {
    render(
      <Field.Root>
        <Field.Label>Callsign</Field.Label>
        <Input />
      </Field.Root>,
    );

    expect(screen.getByRole('textbox', { name: 'Callsign' })).toBeInTheDocument();
  });

  it('takes the invalid state and description from the Field', () => {
    render(
      <Field.Root invalid>
        <Field.Label>Callsign</Field.Label>
        <Input />
        <Field.Error>Required</Field.Error>
      </Field.Root>,
    );

    const input = screen.getByRole('textbox', { name: 'Callsign' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
  });

  it('resolves text colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(<Input aria-label="Callsign" defaultValue="Wayfarer" />);

    expect(rgb(getComputedStyle(screen.getByRole('textbox', { name: 'Callsign' })).color)).toEqual(
      rgb(colors.dark.ink),
    );
  });

  it('draws the design system’s OWN focus ring, not the browser default', () => {
    // The whole point of lib/native-focus.native.ts. Without it a native
    // control falls through to Chrome's blue outline under react-native-web —
    // which is what shipped in DateInput, Select, Input, Textarea and Combobox
    // while Field alone had the fix. Brass, offset by 2px, resolved from the
    // ACTIVE scheme.
    setPrefersColorScheme('light');
    render(<Input aria-label="Callsign" />);

    const input = screen.getByRole('textbox', { name: 'Callsign' });
    expect(getComputedStyle(input).outlineWidth).not.toBe('2px');

    act(() => input.focus());

    const style = getComputedStyle(input);
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineOffset).toBe('2px');
    expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
  });

  // `props` is spread LAST onto the TextInput, so a caller's `onFocus` left in
  // there replaced the ring wiring outright: their handler ran and the ring
  // never turned on. Pulled out of the rest object, both happen.
  it('runs a caller’s own onFocus AND still draws the ring', () => {
    setPrefersColorScheme('light');
    const onFocus = vi.fn();
    render(<Input aria-label="Callsign" onFocus={onFocus} />);

    const input = screen.getByRole('textbox', { name: 'Callsign' });
    act(() => input.focus());

    expect(onFocus).toHaveBeenCalledTimes(1);
    const style = getComputedStyle(input);
    expect(style.outlineWidth).toBe('2px');
    expect(rgb(style.outlineColor)).toEqual(rgb(colors.light.accent));
  });

  it('resolves the ring colour from the dark scheme too', () => {
    setPrefersColorScheme('dark');
    render(<Input aria-label="Callsign" />);

    const input = screen.getByRole('textbox', { name: 'Callsign' });
    act(() => input.focus());

    expect(rgb(getComputedStyle(input).outlineColor)).toEqual(rgb(colors.dark.accent));
  });
});
