// Direct unit tests for the shared filter and keyboard grammar — the part BOTH
// leaves execute. Same reasoning as select.props.test.ts: the grammar is one
// testable table rather than two switch statements that drift apart, and the
// edge cases are pinned once instead of once per platform.
import { describe, expect, it } from 'vitest';

import { comboboxKeyIntent, filterOptions, type ComboboxOption } from './combobox.props';

const MOONS: readonly ComboboxOption[] = [
  { value: 'io', label: 'Io' },
  { value: 'europa', label: 'Europa' },
  { value: 'ganymede', label: 'Ganymede' },
  { value: 'callisto', label: 'Callisto', disabled: true },
];

describe('filterOptions', () => {
  it('returns everything for an empty query', () => {
    expect(filterOptions(MOONS, '', undefined)).toHaveLength(4);
    expect(filterOptions(MOONS, '   ', undefined)).toHaveLength(4);
  });

  it('matches anywhere in the label, not just the start', () => {
    // The deliberate difference from Select's typeahead: a filter is a search,
    // and someone typing "rop" for Europa is not making a mistake.
    expect(filterOptions(MOONS, 'rop', undefined).map((option) => option.value)).toEqual([
      'europa',
    ]);
  });

  it('is case-insensitive', () => {
    expect(filterOptions(MOONS, 'GANY', undefined).map((option) => option.value)).toEqual([
      'ganymede',
    ]);
  });

  it('returns the WHOLE list when the query is the selected label', () => {
    // Committing leaves the full label in the box, so this is the normal state
    // on re-open — without it, the list would show only the option already
    // chosen and the rest would be unreachable without deleting the text.
    expect(filterOptions(MOONS, 'Ganymede', 'Ganymede')).toHaveLength(4);
    // ...but the same text with a DIFFERENT selection is a real query.
    expect(filterOptions(MOONS, 'Ganymede', 'Io')).toHaveLength(1);
  });

  it('returns nothing when no label matches', () => {
    expect(filterOptions(MOONS, 'titan', undefined)).toHaveLength(0);
  });
});

describe('comboboxKeyIntent (closed)', () => {
  const closed = { open: false, visible: MOONS, active: null };

  it('opens downward onto the first enabled option', () => {
    expect(comboboxKeyIntent('ArrowDown', false, closed)).toEqual({ kind: 'open', active: 'io' });
  });

  it('opens upward onto the last ENABLED option, skipping a disabled tail', () => {
    expect(comboboxKeyIntent('ArrowUp', false, closed)).toEqual({
      kind: 'open',
      active: 'ganymede',
    });
  });

  it('ignores everything else, leaving the keys to the text caret', () => {
    for (const key of ['a', ' ', 'Home', 'End', 'Enter', 'Escape']) {
      expect(comboboxKeyIntent(key, false, closed)).toEqual({ kind: 'none' });
    }
  });
});

describe('comboboxKeyIntent (open)', () => {
  const open = (active: string | null) => ({ open: true, visible: MOONS, active });

  it('steps the highlight past disabled options and stops at the end', () => {
    expect(comboboxKeyIntent('ArrowDown', false, open('io'))).toEqual({
      kind: 'active',
      active: 'europa',
    });
    expect(comboboxKeyIntent('ArrowDown', false, open('ganymede'))).toEqual({
      kind: 'active',
      active: 'ganymede',
    });
  });

  it('commits the highlight on Enter', () => {
    expect(comboboxKeyIntent('Enter', false, open('europa'))).toEqual({
      kind: 'commit',
      value: 'europa',
    });
  });

  it('reverts on Escape, on Alt+ArrowUp, and with nothing highlighted', () => {
    expect(comboboxKeyIntent('Escape', false, open('io'))).toEqual({ kind: 'revert' });
    expect(comboboxKeyIntent('ArrowUp', true, open('io'))).toEqual({ kind: 'revert' });
    expect(comboboxKeyIntent('Enter', false, open(null))).toEqual({ kind: 'revert' });
  });

  it('does NOT commit on Tab — the difference from Select', () => {
    // A Select's highlight is the only thing the user has said. A combobox
    // also holds typed text, and silently replacing it as focus leaves is how
    // a form submits a value nobody chose.
    expect(comboboxKeyIntent('Tab', false, open('europa'))).toEqual({ kind: 'revert' });
  });

  it('leaves printable keys, Space, Home and End to the caret', () => {
    for (const key of ['a', ' ', 'Home', 'End']) {
      expect(comboboxKeyIntent(key, false, open('io'))).toEqual({ kind: 'none' });
    }
  });

  it('navigates only what is VISIBLE, not the full option list', () => {
    // "o" matches Io, Europa and Callisto — Ganymede is filtered out, so the
    // highlight must never land on it however the user arrows around.
    const visible = filterOptions(MOONS, 'o', undefined);
    expect(visible.map((option) => option.value)).toEqual(['io', 'europa', 'callisto']);

    // From the top, ArrowDown reaches Europa and stops there: Callisto is
    // disabled, so it is the last ENABLED visible option.
    expect(comboboxKeyIntent('ArrowDown', false, { open: true, visible, active: 'io' })).toEqual({
      kind: 'active',
      active: 'europa',
    });
    expect(
      comboboxKeyIntent('ArrowDown', false, { open: true, visible, active: 'europa' }),
    ).toEqual({ kind: 'active', active: 'europa' });

    // Ganymede is not reachable at all while it is filtered out.
    expect(comboboxKeyIntent('ArrowUp', false, { open: true, visible, active: null })).toEqual({
      kind: 'active',
      active: 'europa',
    });
  });
});
