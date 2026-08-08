// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The group's invariant is the same on both leaves — the Root draws the box,
// the control inside does not — but the mechanism differs (a `border-0` class
// against a StyleSheet entry), so it is worth pinning here rather than
// inferring from the web leaf.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Input } from '../input/input';
import { InputGroup } from './input-group';

describe('InputGroup (native leaf)', () => {
  it('drops the control’s own border and background inside a group', () => {
    render(
      <InputGroup.Root>
        <InputGroup.Text>https://</InputGroup.Text>
        <Input aria-label="Domain" />
      </InputGroup.Root>,
    );

    const style = getComputedStyle(screen.getByRole('textbox', { name: 'Domain' }));
    expect(style.borderTopWidth === '' || style.borderTopWidth === '0px').toBe(true);
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('renders the addon text', () => {
    render(
      <InputGroup.Root>
        <InputGroup.Text>kg</InputGroup.Text>
        <Input aria-label="Mass" />
      </InputGroup.Root>,
    );

    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('resolves the addon colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(
      <InputGroup.Root>
        <InputGroup.Text>kg</InputGroup.Text>
        <Input aria-label="Mass" />
      </InputGroup.Root>,
    );

    expect(rgb(getComputedStyle(screen.getByText('kg')).color)).toEqual(rgb(colors.dark.muted));
  });
});
