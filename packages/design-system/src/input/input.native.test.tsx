// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// This leaf carries the a11y wiring that the web leaf gets from the platform:
// there is no `<label for>` here, so the control points BACK at the label with
// `aria-labelledby`, and that direction is exactly what shipped broken in
// 0.2.1 for Field.
import { render, screen } from '@testing-library/react';
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
});
