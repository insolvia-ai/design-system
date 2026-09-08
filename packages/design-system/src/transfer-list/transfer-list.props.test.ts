// Direct unit tests for the pure functions and the checked-state hook, separate
// from the DOM tests: this module is what BOTH leaves execute, so partitioning,
// moving and the checked sets are pinned here once instead of once per platform.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  hasMovable,
  moveAll,
  moveChecked,
  partition,
  resolveLabels,
  useTransferListChecked,
  type TransferListOption,
} from './transfer-list.props';

const OPTIONS: TransferListOption[] = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C', disabled: true },
  { value: 'd', label: 'Option D' },
];

describe('partition', () => {
  it('splits into left (not chosen, options order) and right (chosen, value order)', () => {
    const { left, right } = partition(OPTIONS, ['d', 'b']);

    expect(left.map((o) => o.value)).toEqual(['a', 'c']);
    expect(right.map((o) => o.value)).toEqual(['d', 'b']);
  });

  it('an empty value puts everything on the left', () => {
    const { left, right } = partition(OPTIONS, []);

    expect(left.map((o) => o.value)).toEqual(['a', 'b', 'c', 'd']);
    expect(right).toEqual([]);
  });

  it('drops a value that no longer names an option, rather than fabricating one', () => {
    const { right } = partition(OPTIONS, ['b', 'ghost']);

    expect(right.map((o) => o.value)).toEqual(['b']);
  });
});

describe('hasMovable', () => {
  it('true when at least one option is enabled', () => {
    expect(hasMovable(OPTIONS)).toBe(true);
  });

  it('false when every option is disabled', () => {
    expect(hasMovable([{ value: 'x', label: 'X', disabled: true }])).toBe(false);
  });

  it('false for an empty list', () => {
    expect(hasMovable([])).toBe(false);
  });
});

describe('moveChecked', () => {
  it('direction right: appends checked left items in OPTIONS order, not check order', () => {
    const next = moveChecked(OPTIONS, ['b'], new Set(['d', 'a']), new Set(), 'right');
    expect(next).toEqual(['b', 'a', 'd']);
  });

  it('direction right: a disabled option never moves, even if checked', () => {
    const next = moveChecked(OPTIONS, [], new Set(['c']), new Set(), 'right');
    expect(next).toEqual([]);
  });

  it('direction left: drops checked right items, keeping the rest in value order', () => {
    const next = moveChecked(OPTIONS, ['d', 'b', 'a'], new Set(), new Set(['b']), 'left');
    expect(next).toEqual(['d', 'a']);
  });

  it('direction left: an unchecked right item stays', () => {
    const next = moveChecked(OPTIONS, ['a', 'd'], new Set(), new Set(), 'left');
    expect(next).toEqual(['a', 'd']);
  });
});

describe('moveAll', () => {
  it('direction right: every enabled left option moves, disabled ones stay behind', () => {
    const next = moveAll(OPTIONS, [], 'right');
    expect(next).toEqual(['a', 'b', 'd']);
  });

  it('direction left: every enabled right option moves back, disabled ones stay chosen', () => {
    const disabledChosen: TransferListOption[] = [
      { value: 'x', label: 'X', disabled: true },
      { value: 'y', label: 'Y' },
    ];
    const next = moveAll(disabledChosen, ['x', 'y'], 'left');
    expect(next).toEqual(['x']);
  });

  it('is a no-op on an already-empty source', () => {
    expect(moveAll(OPTIONS, ['a', 'b', 'd'], 'right')).toEqual(['a', 'b', 'd']);
    expect(moveAll(OPTIONS, [], 'left')).toEqual([]);
  });
});

describe('resolveLabels', () => {
  it('fills in every default when nothing is given', () => {
    expect(resolveLabels(undefined)).toEqual({
      available: 'Available',
      chosen: 'Chosen',
      moveRight: 'Move selected right',
      moveLeft: 'Move selected left',
      moveAllRight: 'Move all right',
      moveAllLeft: 'Move all left',
    });
  });

  it('a caller-given label wins, and the rest keep their default', () => {
    const labels = resolveLabels({ available: 'Candidates' });
    expect(labels.available).toBe('Candidates');
    expect(labels.chosen).toBe('Chosen');
  });
});

describe('useTransferListChecked', () => {
  it('starts with both sets empty', () => {
    const { result } = renderHook(() => useTransferListChecked());
    expect(result.current.checkedLeft.size).toBe(0);
    expect(result.current.checkedRight.size).toBe(0);
  });

  it('toggleLeft adds an absent value and removes a present one', () => {
    const { result } = renderHook(() => useTransferListChecked());

    act(() => result.current.toggleLeft('a'));
    expect([...result.current.checkedLeft]).toEqual(['a']);

    act(() => result.current.toggleLeft('a'));
    expect(result.current.checkedLeft.size).toBe(0);
  });

  it('toggleRight is independent of the left set', () => {
    const { result } = renderHook(() => useTransferListChecked());

    act(() => result.current.toggleLeft('a'));
    act(() => result.current.toggleRight('b'));

    expect([...result.current.checkedLeft]).toEqual(['a']);
    expect([...result.current.checkedRight]).toEqual(['b']);
  });

  it('clearLeft/clearRight empty exactly their own set', () => {
    const { result } = renderHook(() => useTransferListChecked());

    act(() => {
      result.current.toggleLeft('a');
      result.current.toggleRight('b');
    });
    act(() => result.current.clearLeft());

    expect(result.current.checkedLeft.size).toBe(0);
    expect([...result.current.checkedRight]).toEqual(['b']);
  });
});
