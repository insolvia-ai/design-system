import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ComboboxOption } from './combobox.props';
import { Combobox } from './combobox';

const MOONS: readonly ComboboxOption[] = [
  { value: 'io', label: 'Io' },
  { value: 'europa', label: 'Europa' },
  { value: 'ganymede', label: 'Ganymede' },
  { value: 'callisto', label: 'Callisto', disabled: true },
];

function open() {
  return screen.getByRole('combobox', { name: 'Moon' });
}

describe('Combobox', () => {
  it('starts closed and claims no listbox to expand into', () => {
    render(<Combobox aria-label="Moon" options={MOONS} />);

    expect(open()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('filters the list as you type and commits a click', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} onValueChange={onValueChange} />);

    await user.type(open(), 'rop');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);

    await user.click(screen.getByRole('option', { name: 'Europa' }));

    expect(onValueChange).toHaveBeenCalledWith('europa');
    // The committed label goes back in the box.
    expect(open()).toHaveValue('Europa');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('re-opening a committed combobox shows the WHOLE list again', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} defaultValue="ganymede" />);

    await user.click(open());
    await user.keyboard('{ArrowDown}');

    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('walks the highlight with the arrows and commits on Enter', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} onValueChange={onValueChange} />);

    await user.click(open());
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('europa');
    expect(open()).toHaveValue('Europa');
  });

  it('points aria-activedescendant at the highlighted option, and only while open', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} />);

    await user.click(open());
    await user.keyboard('{ArrowDown}');

    const active = screen.getByRole('option', { name: 'Io' });
    expect(open()).toHaveAttribute('aria-activedescendant', active.id);

    await user.keyboard('{Escape}');
    expect(open()).not.toHaveAttribute('aria-activedescendant');
  });

  it('Escape discards typed text and restores the committed label', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} defaultValue="io" />);

    await user.clear(open());
    await user.type(open(), 'gany');
    await user.keyboard('{Escape}');

    expect(open()).toHaveValue('Io');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a live-region message rather than an empty listbox', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} />);

    await user.type(open(), 'titan');

    // An option-less listbox would fail `aria-required-children`, and there
    // would be nothing to navigate.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No matches');
    expect(open()).toHaveAttribute('aria-expanded', 'false');
  });

  it('never commits a disabled option', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" options={MOONS} onValueChange={onValueChange} />);

    await user.type(open(), 'callisto');
    await user.click(screen.getByRole('option', { name: 'Callisto' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('submits the committed value, never the half-typed query', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Moon" name="moon" options={MOONS} defaultValue="io" />);

    await user.clear(open());
    await user.type(open(), 'gany');

    const hidden = document.querySelector('input[type="hidden"][name="moon"]');
    expect(hidden).toHaveValue('io');
  });
});
