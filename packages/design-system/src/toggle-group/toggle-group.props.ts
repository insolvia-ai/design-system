// SHARED — imports `react` and `../lib/controllable` only. No react-dom, no
// react-native. The group's entire behavior model: a controlled-or-uncontrolled
// array of pressed values, and a toggle that adds/removes (or, outside
// `multiple` mode, replaces) one member. Both leaves consume it verbatim;
// `toggle.props.ts` reads this context (one-way dependency — the group never
// imports anything from `../toggle`) so a `Toggle` given a `value` prop can
// derive its pressed state from, and toggle into, an ancestor group instead
// of its own standalone state. Mirrors `checkbox-group.props.ts`'s shape.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

/**
 * The two heights a Toggle comes in — Button's `sm` and `md` exactly, so a
 * toggle group and a button sit on one row at one height.
 *
 * WHY THIS TYPE IS DECLARED IN THE *GROUP'S* MODULE. It reads like Toggle's
 * axis, and it is; but `toggle.props.ts` imports THIS file and this file
 * imports nothing from `../toggle` — a deliberate one-way edge stated in the
 * header above. The group's context has to carry the size (that is the whole
 * point of setting it once on `ToggleGroup.Root`), so the type has to be
 * reachable from here, and importing it from `../toggle` would close the loop.
 * `toggle.props.ts` re-exports it, so `ToggleSize` is still the name a caller
 * imports and still reads as Toggle's own axis from outside the package.
 */
export type ToggleSize = 'sm' | 'md';

export interface ToggleGroupContextValue {
  /** The group's current pressed value(s). */
  value: string[];
  /**
   * Press `itemValue` if absent; unpress it if present. Outside `multiple`
   * mode, pressing a new value also unpresses whatever was pressed before.
   */
  toggle: (itemValue: string) => void;
  /** Group-level disable — ORed with each toggle's own `disabled`, so a toggle cannot opt out of a disabled group. */
  disabled: boolean;
  /**
   * The size every member wears unless it names its own. Unlike `disabled`,
   * which is ORed so a toggle cannot escape a disabled group, this is a
   * DEFAULT: a group is one control made of parts and its members should agree
   * on height, but nothing about that is a safety property, so a member that
   * asks for a different size gets it.
   */
  size: ToggleSize;
}

export const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

/**
 * Returns the enclosing group's context, or `null` when there isn't one — a
 * `Toggle` is valid both standalone and inside a `ToggleGroup.Root`, so
 * unlike Accordion/Field's `use*Context`, this does NOT throw outside its
 * provider.
 */
export function useToggleGroupContext(): ToggleGroupContextValue | null {
  return React.useContext(ToggleGroupContext);
}

export interface ToggleGroupRootOwnProps {
  /** The group's pressed value(s). Controlled: parent owns the array. */
  value?: string[] | undefined;
  /** Pressed value(s) on first render. Uncontrolled; omit for nothing pressed. */
  defaultValue?: string[] | undefined;
  onValueChange?: ((value: string[]) => void) | undefined;
  /**
   * When true, more than one toggle may be pressed at once. Defaults to
   * false (single-select): `value` is still always `string[]` in that mode
   * (at most one entry) — the same shape either way, so callers don't
   * branch on `multiple` to read or set it. This differs from Base UI's
   * ToggleGroup, whose `value` is a bare string outside `multiple` mode.
   */
  multiple?: boolean | undefined;
  /** Disables every toggle that reads this group's context. */
  disabled?: boolean | undefined;
  /**
   * The size for every toggle in the group. Defaults to `md`. A view switch
   * meant for a phone toolbar sets `sm` here once rather than on each member —
   * two members at the default size measured about 157px, which is 44% of a
   * 390px row before the rest of the toolbar has asked for anything.
   */
  size?: ToggleSize | undefined;
}

/**
 * The group's selection state machine — pure React, identical on both
 * platforms. Builds on `useControllableState` for the controlled/
 * uncontrolled split; `toggle` derives the next array from the current one,
 * which the setter (by contract) never needs — the caller always has it in
 * scope.
 */
export function useToggleGroupState(
  value: string[] | undefined,
  defaultValue: string[] | undefined,
  onValueChange: ((value: string[]) => void) | undefined,
  multiple: boolean,
  disabled: boolean,
  size: ToggleSize,
): ToggleGroupContextValue {
  const [current, setCurrent] = useControllableState<string[]>(
    value,
    defaultValue ?? [],
    onValueChange,
  );

  const toggle = React.useCallback(
    (itemValue: string) => {
      const isCurrentlyPressed = current.includes(itemValue);
      if (multiple) {
        setCurrent(
          isCurrentlyPressed ? current.filter((v) => v !== itemValue) : [...current, itemValue],
        );
      } else {
        setCurrent(isCurrentlyPressed ? [] : [itemValue]);
      }
    },
    [current, multiple, setCurrent],
  );

  return React.useMemo(
    () => ({ value: current, toggle, disabled, size }),
    [current, toggle, disabled, size],
  );
}
