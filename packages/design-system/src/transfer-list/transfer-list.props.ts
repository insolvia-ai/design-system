// SHARED — imports `react` and `../lib/controllable` only. No react-dom, no
// react-native. This is the whole transfer list: splitting `options` into a
// left ("available") and right ("chosen") column from one `value` array,
// which items are checked in each column, and what a move does to `value`.
// The leaves render elements and nothing else.
//
// WHY `value` IS THE RIGHT LIST'S CONTENTS, not a separate "committed" state.
// A transfer list has exactly one piece of durable state — which values ended
// up chosen — and the left/right split is a pure function of it plus
// `options`. Modeling a second array for "the left list" would let the two
// drift (an option removed from `options` while chosen would vanish from
// neither, or from both), so `partition` derives both columns fresh on every
// render instead.
//
// CHECKED STATE IS SEPARATE FROM CHOSEN STATE. Checking a row is a
// browsing gesture — "I might move this" — and clears the moment it does; the
// two `Set<string>` here never touch `value` except through `moveChecked`.
// That mirrors `CheckboxGroup`, which also keeps "checked" (this component's
// analogue of a member) out of anything resembling selection-for-an-action.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export interface TransferListOption {
  /** Stored value. Must be unique within one TransferList's `options`. */
  value: string;
  /** Visible row text. */
  label: string;
  /** Cannot be checked, moved individually, or swept by a "move all". */
  disabled?: boolean;
}

export type TransferListOrientation = 'horizontal' | 'vertical';

export type TransferListDirection = 'left' | 'right';

export interface TransferListLabels {
  available?: string;
  chosen?: string;
  moveRight?: string;
  moveLeft?: string;
  moveAllRight?: string;
  moveAllLeft?: string;
}

const DEFAULT_LABELS = {
  available: 'Available',
  chosen: 'Chosen',
  moveRight: 'Move selected right',
  moveLeft: 'Move selected left',
  moveAllRight: 'Move all right',
  moveAllLeft: 'Move all left',
} satisfies Required<TransferListLabels>;

/** Fills in defaults for any label a caller omits. */
export function resolveLabels(
  labels: TransferListLabels | undefined,
): Required<TransferListLabels> {
  return { ...DEFAULT_LABELS, ...labels };
}

export interface TransferListPartition {
  /** Options NOT in `value`, in `options` order. */
  left: TransferListOption[];
  /** Options in `value`, in `value` order. An entry `value` names that is no
   * longer in `options` is dropped rather than fabricated. */
  right: TransferListOption[];
}

/** Splits `options` into the two columns a `value` array implies. */
export function partition(
  options: readonly TransferListOption[],
  value: readonly string[],
): TransferListPartition {
  const chosen = new Set(value);
  const left = options.filter((option) => !chosen.has(option.value));
  const byValue = new Map(options.map((option) => [option.value, option]));
  const right = value
    .map((v) => byValue.get(v))
    .filter((option): option is TransferListOption => option !== undefined);
  return { left, right };
}

/** True while at least one option in `list` can be checked or moved. */
export function hasMovable(list: readonly TransferListOption[]): boolean {
  return list.some((option) => !option.disabled);
}

/**
 * The next `value` after moving the CHECKED items one direction. A disabled
 * option never moves even if its value somehow ended up in a checked set —
 * the leaves never let one be checked in the first place, but this is the
 * single place that guarantee is enforced rather than trusted at every call
 * site.
 */
export function moveChecked(
  options: readonly TransferListOption[],
  value: readonly string[],
  checkedLeft: ReadonlySet<string>,
  checkedRight: ReadonlySet<string>,
  direction: TransferListDirection,
): string[] {
  if (direction === 'right') {
    const { left } = partition(options, value);
    const moving = left
      .filter((option) => !option.disabled && checkedLeft.has(option.value))
      .map((option) => option.value);
    // Appended in LEFT (options) order, not checked-set iteration order —
    // Set preserves insertion order, which is click order, not list order,
    // and the right column should read the same regardless of which box the
    // user checked first.
    return [...value, ...moving];
  }
  const disabledValues = new Set(
    options.filter((option) => option.disabled).map((option) => option.value),
  );
  // A disabled value can never be IN `checkedRight` (nothing here can check
  // one), but keeping it here too rather than trusting that invariant is what
  // makes this function correct on its own, not just in combination with the
  // leaves.
  return value.filter((v) => disabledValues.has(v) || !checkedRight.has(v));
}

/** The next `value` after moving EVERY enabled item one direction, ignoring
 * checked state entirely — "move all" is a bulk action, not a checked one. */
export function moveAll(
  options: readonly TransferListOption[],
  value: readonly string[],
  direction: TransferListDirection,
): string[] {
  const { left, right } = partition(options, value);
  if (direction === 'right') {
    const moving = left.filter((option) => !option.disabled).map((option) => option.value);
    return [...value, ...moving];
  }
  // What's LEFT of `right` after sweeping every enabled item out of it — kept
  // in `right`'s (i.e. `value`'s) order, same as everywhere else here.
  return right.filter((option) => option.disabled).map((option) => option.value);
}

export interface TransferListCheckedState {
  checkedLeft: ReadonlySet<string>;
  checkedRight: ReadonlySet<string>;
  toggleLeft: (value: string) => void;
  toggleRight: (value: string) => void;
  clearLeft: () => void;
  clearRight: () => void;
}

/**
 * The two checked sets, independent of `value`. A ref would not do: a leaf
 * has to re-render when a box is (un)checked, the same reason
 * `useCheckboxGroupState` is state and not a ref.
 */
export function useTransferListChecked(): TransferListCheckedState {
  const [checkedLeft, setCheckedLeft] = React.useState<Set<string>>(() => new Set());
  const [checkedRight, setCheckedRight] = React.useState<Set<string>>(() => new Set());

  const toggleLeft = React.useCallback((value: string) => {
    setCheckedLeft((prev) => toggleInSet(prev, value));
  }, []);
  const toggleRight = React.useCallback((value: string) => {
    setCheckedRight((prev) => toggleInSet(prev, value));
  }, []);
  const clearLeft = React.useCallback(() => setCheckedLeft(new Set()), []);
  const clearRight = React.useCallback(() => setCheckedRight(new Set()), []);

  return React.useMemo(
    () => ({ checkedLeft, checkedRight, toggleLeft, toggleRight, clearLeft, clearRight }),
    [checkedLeft, checkedRight, toggleLeft, toggleRight, clearLeft, clearRight],
  );
}

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export interface TransferListOwnProps {
  /** The universe of options. Which are chosen is `value`; order within each
   * column follows `options` (left) or `value` (right). */
  options: readonly TransferListOption[];
  /** Controlled: the values in the CHOSEN (right) list. */
  value?: string[] | undefined;
  /** Chosen values on first render. Uncontrolled; omit for none chosen. */
  defaultValue?: string[] | undefined;
  onValueChange?: ((next: string[]) => void) | undefined;
  /** Column headings and the four move buttons' accessible names. Any label
   * omitted keeps its default (see `resolveLabels`). */
  labels?: TransferListLabels | undefined;
  /** Show the "move all" pair (`»`/`«`) alongside "move selected". Default `true`. */
  showMoveAll?: boolean | undefined;
  disabled?: boolean | undefined;
  /** `'horizontal'` (default) sits the two columns side by side with the
   * buttons between them; `'vertical'` stacks them with the buttons in a row
   * between — what a phone-width layout needs. */
  orientation?: TransferListOrientation | undefined;
}

export interface TransferListState {
  left: TransferListOption[];
  right: TransferListOption[];
  checkedLeft: ReadonlySet<string>;
  checkedRight: ReadonlySet<string>;
  toggleLeft: (value: string) => void;
  toggleRight: (value: string) => void;
  moveSelectedRight: () => void;
  moveSelectedLeft: () => void;
  moveAllRight: () => void;
  moveAllLeft: () => void;
  canMoveSelectedRight: boolean;
  canMoveSelectedLeft: boolean;
  canMoveAllRight: boolean;
  canMoveAllLeft: boolean;
}

/**
 * The whole component's behavior: the derived columns, the two checked sets,
 * and the four move actions — each of which applies the pure function above
 * through `useControllableState`'s setter and then clears the checked set(s)
 * that emptied out. Both leaves call this and render its result; neither
 * leaf computes a column or a next `value` itself.
 */
export function useTransferListState(
  options: readonly TransferListOption[],
  value: string[] | undefined,
  defaultValue: string[] | undefined,
  onValueChange: ((next: string[]) => void) | undefined,
): TransferListState {
  const [current, setCurrent] = useControllableState<string[]>(
    value,
    defaultValue ?? [],
    onValueChange,
  );
  const checked = useTransferListChecked();
  const { left, right } = partition(options, current);

  const moveSelectedRight = React.useCallback(() => {
    setCurrent(moveChecked(options, current, checked.checkedLeft, checked.checkedRight, 'right'));
    checked.clearLeft();
  }, [options, current, checked, setCurrent]);

  const moveSelectedLeft = React.useCallback(() => {
    setCurrent(moveChecked(options, current, checked.checkedLeft, checked.checkedRight, 'left'));
    checked.clearRight();
  }, [options, current, checked, setCurrent]);

  const moveAllRight = React.useCallback(() => {
    setCurrent(moveAll(options, current, 'right'));
    checked.clearLeft();
  }, [options, current, checked, setCurrent]);

  const moveAllLeft = React.useCallback(() => {
    setCurrent(moveAll(options, current, 'left'));
    checked.clearRight();
  }, [options, current, checked, setCurrent]);

  return {
    left,
    right,
    checkedLeft: checked.checkedLeft,
    checkedRight: checked.checkedRight,
    toggleLeft: checked.toggleLeft,
    toggleRight: checked.toggleRight,
    moveSelectedRight,
    moveSelectedLeft,
    moveAllRight,
    moveAllLeft,
    canMoveSelectedRight: checked.checkedLeft.size > 0,
    canMoveSelectedLeft: checked.checkedRight.size > 0,
    canMoveAllRight: hasMovable(left),
    canMoveAllLeft: hasMovable(right),
  };
}
