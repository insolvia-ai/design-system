// SHARED — `react`, `../lib/controllable` and Select's own shared module. No
// react-dom, no react-native.
//
// A combobox is a Select whose trigger you can type into, so the option model,
// the enabled-option walk and the id scheme are IMPORTED from select.props
// rather than restated. Sharing them is not tidiness: an option list that
// stepped differently in the two components would be two answers to one
// question, and the whole reason `SelectOption` is a public type is that a
// consumer can hand the same array to either.
//
// What is genuinely new here is the filter and the keyboard grammar. A Select
// TYPEAHEADS — keystrokes jump the highlight and the option list never
// changes. A Combobox FILTERS — keystrokes narrow the list, so every key that
// a Select spends on navigation (Home, End, Space, printable characters) has
// to go to the text caret instead.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';
import {
  findOption,
  firstEnabled,
  lastEnabled,
  stepEnabled,
  type SelectOption,
  type SelectValue,
} from '../select/select.props';

export type { SelectOption as ComboboxOption, SelectValue as ComboboxValue };

/**
 * The options whose label contains `query`, case-insensitively.
 *
 * `includes` rather than `startsWith`, which is the one place this deliberately
 * differs from Select's typeahead: typeahead is a jump within a list you can
 * already see, so anchoring at the start is predictable, while a filter is a
 * search — someone looking for "New Jersey" by typing "jersey" is not making a
 * mistake.
 *
 * WHEN THE QUERY IS THE SELECTED LABEL, EVERYTHING MATCHES. Re-opening a
 * combobox that already holds "Ganymede" would otherwise show exactly one
 * option — itself — and there would be no way to see the rest of the list
 * without first deleting what is in the box. Committing a value leaves its
 * full label in the input, so this case is the norm rather than an edge.
 */
export function filterOptions(
  options: readonly SelectOption[],
  query: string,
  selectedLabel: string | undefined,
): readonly SelectOption[] {
  const trimmed = query.trim();
  if (trimmed === '' || trimmed === selectedLabel) return options;
  const needle = trimmed.toLowerCase();
  return options.filter((option) => option.label.toLowerCase().includes(needle));
}

/**
 * What a keypress means on a combobox.
 *
 * Pure, so the grammar is one testable table rather than two switch statements
 * that drift — the same reasoning as `selectKeyIntent`, and the same shape.
 */
export type ComboboxIntent =
  | { kind: 'none' }
  | { kind: 'open'; active: SelectValue }
  /** Close and put the committed value's label back in the box. */
  | { kind: 'revert' }
  | { kind: 'active'; active: string }
  | { kind: 'commit'; value: string };

export interface ComboboxKeyState {
  open: boolean;
  /** The FILTERED options — navigation only ever walks what is on screen. */
  visible: readonly SelectOption[];
  active: SelectValue;
}

export function comboboxKeyIntent(
  key: string,
  altKey: boolean,
  state: ComboboxKeyState,
): ComboboxIntent {
  const { open, visible, active } = state;

  if (!open) {
    if (key === 'ArrowDown') return { kind: 'open', active: firstEnabled(visible) };
    if (key === 'ArrowUp') return { kind: 'open', active: lastEnabled(visible) };
    return { kind: 'none' };
  }

  switch (key) {
    case 'Escape':
      return { kind: 'revert' };
    case 'ArrowDown':
    case 'ArrowUp': {
      if (altKey && key === 'ArrowUp') return { kind: 'revert' };
      const next = stepEnabled(visible, active, key === 'ArrowDown' ? 1 : -1);
      return next === null ? { kind: 'none' } : { kind: 'active', active: next };
    }
    case 'Enter':
      return active === null ? { kind: 'revert' } : { kind: 'commit', value: active };
    case 'Tab':
      // Moving on does NOT commit the highlight, which is where this parts
      // company with Select. A Select's highlight is the only thing the user
      // has said; a combobox also holds typed text, and silently replacing
      // what someone typed as they tab away is how a form ends up submitting a
      // value nobody chose. The leaf must not preventDefault — focus has to
      // keep going.
      return { kind: 'revert' };
    default:
      // Home, End, Space, and every printable character belong to the text
      // caret. A Select spends all of them on navigation; here, hijacking any
      // one of them would make the box impossible to edit.
      return { kind: 'none' };
  }
}

export interface ComboboxOwnProps {
  options: readonly SelectOption[];
  // `| undefined` on every optional: `exactOptionalPropertyTypes` is on.
  value?: SelectValue | undefined;
  defaultValue?: SelectValue | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  name?: string | undefined;
  /** Shown in place of the list when the filter matches nothing. */
  emptyMessage?: string | undefined;
}

export const DEFAULT_EMPTY_MESSAGE = 'No matches';

export interface ComboboxState {
  value: SelectValue;
  selected: SelectOption | undefined;
  query: string;
  setQuery: (next: string) => void;
  visible: readonly SelectOption[];
  open: boolean;
  setOpen: (next: boolean) => void;
  active: SelectValue;
  setActive: (next: SelectValue) => void;
  commit: (next: string) => void;
  /** Close, discarding uncommitted text. Escape, Tab and blur all land here. */
  revert: () => void;
  rootId: string;
}

export function useComboboxState({
  options,
  value,
  defaultValue = null,
  onValueChange,
}: Pick<ComboboxOwnProps, 'options' | 'value' | 'defaultValue' | 'onValueChange'>): ComboboxState {
  const [current, setCurrent] = useControllableState<SelectValue>(
    value,
    defaultValue,
    onValueChange as ((next: SelectValue) => void) | undefined,
  );
  const selected = findOption(options, current);
  const [query, setQueryState] = React.useState<string>(selected?.label ?? '');
  const [open, setOpenState] = React.useState(false);
  const [active, setActive] = React.useState<SelectValue>(null);
  const rootId = React.useId();

  const visible = React.useMemo(
    () => filterOptions(options, query, selected?.label),
    [options, query, selected?.label],
  );

  const setOpen = React.useCallback((next: boolean) => {
    setOpenState(next);
    if (!next) setActive(null);
  }, []);

  // Typing always opens the list: a filter nobody can see is just a text box
  // that quietly rejects values.
  const setQuery = React.useCallback((next: string) => {
    setQueryState(next);
    setOpenState(true);
    setActive(null);
  }, []);

  const commit = React.useCallback(
    (next: string) => {
      const option = options.find((candidate) => candidate.value === next);
      setCurrent(next);
      // The committed label goes back in the box — which is exactly the state
      // `filterOptions` special-cases, so re-opening shows the whole list.
      setQueryState(option?.label ?? '');
      setOpenState(false);
      setActive(null);
    },
    [options, setCurrent],
  );

  const revert = React.useCallback(() => {
    setQueryState(selected?.label ?? '');
    setOpenState(false);
    setActive(null);
  }, [selected?.label]);

  return React.useMemo(
    () => ({
      value: current,
      selected,
      query,
      setQuery,
      visible,
      open,
      setOpen,
      active,
      setActive,
      commit,
      revert,
      rootId,
    }),
    [current, selected, query, setQuery, visible, open, setOpen, active, commit, revert, rootId],
  );
}
