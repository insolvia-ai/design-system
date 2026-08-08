// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// This leaf carries the whole a11y surface by hand — `role="combobox"` on a
// TextInput, a `role="listbox"` View that RN's own types do not admit exists,
// and `aria-activedescendant` pointing into it — plus the mousedown guard that
// makes clicking an option possible at all under react-native-web. None of
// that is inferable from the web leaf passing.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from './combobox';
import type { ComboboxOption } from './combobox.props';

const MOONS: readonly ComboboxOption[] = [
  { value: 'io', label: 'Io' },
  { value: 'europa', label: 'Europa' },
  { value: 'ganymede', label: 'Ganymede' },
];

function control() {
  return screen.getByRole('combobox', { name: 'Moon' });
}

describe('Combobox (native leaf)', () => {
  it('filters as you type', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} />);

    await user.type(control(), 'rop');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Europa' })).toBeInTheDocument();
  });

  it('commits a pressed option — the mousedown guard is what makes this work', async () => {
    // Under react-native-web the input's blur fires BEFORE an option's press,
    // so without the list cancelling mousedown, `revert()` unmounts the list
    // between pointerdown and pointerup and the press never completes.
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} onValueChange={onValueChange} />);

    await user.type(control(), 'gany');
    await user.click(screen.getByRole('option', { name: 'Ganymede' }));

    expect(onValueChange).toHaveBeenCalledWith('ganymede');
    expect(control()).toHaveValue('Ganymede');
  });

  it('announces the list through aria-controls and aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} />);

    expect(control()).toHaveAttribute('aria-expanded', 'false');

    await user.type(control(), 'o');

    const listbox = screen.getByRole('listbox');
    expect(control()).toHaveAttribute('aria-expanded', 'true');
    expect(control()).toHaveAttribute('aria-controls', listbox.id);
  });

  it('shows the empty message as a live region', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} />);

    await user.type(control(), 'titan');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No matches');
  });
});
