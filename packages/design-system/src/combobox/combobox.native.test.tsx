// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// This leaf carries the whole a11y surface by hand — `role="combobox"` on a
// TextInput, a `role="listbox"` View that RN's own types do not admit exists,
// and `aria-activedescendant` pointing into it — plus the mousedown guard that
// makes clicking an option possible at all under react-native-web. None of
// that is inferable from the web leaf passing.
//
// The keyboard block below is the coverage whose absence let 0.23.0 ship a
// combobox no key could drive under react-native-web: the leaf's `onKeyDown`
// sat on the TextInput, where react-native-web overwrites it. The web leaf's
// keyboard tests could not see that — a DOM `<input>` keeps the handler it is
// given. Only a test rendering THIS leaf can.
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

  describe('keyboard', () => {
    it('opens on ArrowDown from a closed, focused field', async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="Moon" options={MOONS} />);

      await user.click(control());
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(control()).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Io' }).id,
      );
    });

    it('opens on ArrowUp with the LAST option active', async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="Moon" options={MOONS} />);

      await user.click(control());
      await user.keyboard('{ArrowUp}');

      expect(control()).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Ganymede' }).id,
      );
    });

    it('steps the highlight through the FILTERED options', async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="Moon" options={MOONS} />);

      // Two matches — 'Io' and 'Europa' — so stepping twice must not reach
      // Ganymede, which is filtered out.
      await user.type(control(), 'o');
      await user.keyboard('{ArrowDown}{ArrowDown}');

      expect(control()).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Europa' }).id,
      );
    });

    it('commits the highlight on Enter', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Combobox aria-label="Moon" options={MOONS} onValueChange={onValueChange} />);

      await user.click(control());
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(onValueChange).toHaveBeenCalledWith('europa');
      expect(control()).toHaveValue('Europa');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('reverts on Escape, discarding what was typed', async () => {
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Combobox
          aria-label="Moon"
          options={MOONS}
          defaultValue="io"
          onValueChange={onValueChange}
        />,
      );

      await user.type(control(), 'gany');
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(control()).toHaveValue('Io');
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('leaves ordinary typing to the text caret', async () => {
      // The capture-phase binding sees every key. It must claim only the ones
      // the grammar names: Home, End, Space and every printable character
      // belong to the caret, or the box cannot be edited at all.
      const user = userEvent.setup();
      render(<Combobox aria-label="Moon" options={MOONS} />);

      await user.type(control(), 'eur');
      await user.keyboard('{Home}{End} o');

      expect(control()).toHaveValue('eur o');
      expect(screen.getByRole('status')).toHaveTextContent('No matches');
    });

    it('does not commit the highlight on Tab', async () => {
      // Tab reverts and lets focus go: silently replacing typed text as
      // someone tabs away is how a form submits a value nobody chose.
      const onValueChange = vi.fn();
      const user = userEvent.setup();
      render(<Combobox aria-label="Moon" options={MOONS} onValueChange={onValueChange} />);

      await user.click(control());
      await user.keyboard('{ArrowDown}');
      await user.tab();

      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(control()).not.toHaveFocus();
    });
  });
});
