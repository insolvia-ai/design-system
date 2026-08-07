// Direct unit tests for the shared state machine, separate from the DOM
// tests: this module is what BOTH leaves execute, so its controlled/
// uncontrolled and add/remove edge cases are pinned here once.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCheckboxGroupState } from './checkbox-group.props';

describe('useCheckboxGroupState', () => {
  it('starts empty without a defaultValue', () => {
    const { result } = renderHook(() =>
      useCheckboxGroupState(undefined, undefined, undefined, false),
    );

    expect(result.current.value).toEqual([]);
  });

  it('honours defaultValue on first render (uncontrolled)', () => {
    const { result } = renderHook(() =>
      useCheckboxGroupState(undefined, ['cargo'], undefined, false),
    );

    expect(result.current.value).toEqual(['cargo']);
  });

  it('toggle adds an absent value and removes a present one', () => {
    const { result } = renderHook(() => useCheckboxGroupState(undefined, [], undefined, false));

    act(() => result.current.toggle('cargo'));
    expect(result.current.value).toEqual(['cargo']);

    act(() => result.current.toggle('fuel'));
    expect(result.current.value).toEqual(['cargo', 'fuel']);

    act(() => result.current.toggle('cargo'));
    expect(result.current.value).toEqual(['fuel']);
  });

  it('fires onValueChange with the next array in both controlled and uncontrolled modes', () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() => useCheckboxGroupState(undefined, [], onValueChange, false));

    act(() => result.current.toggle('cargo'));

    expect(onValueChange).toHaveBeenCalledWith(['cargo']);
  });

  it('in controlled mode, toggle reports the requested array but does not apply it locally', () => {
    const onValueChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useCheckboxGroupState(value, [], onValueChange, false),
      { initialProps: { value: ['cargo'] } },
    );

    act(() => result.current.toggle('fuel'));

    expect(onValueChange).toHaveBeenCalledWith(['cargo', 'fuel']);
    // Parent owns the value: nothing changes until it re-renders with a new one.
    expect(result.current.value).toEqual(['cargo']);

    rerender({ value: ['cargo', 'fuel'] });
    expect(result.current.value).toEqual(['cargo', 'fuel']);
  });

  it('carries the disabled flag through to context consumers', () => {
    const { result } = renderHook(() => useCheckboxGroupState(undefined, [], undefined, true));

    expect(result.current.disabled).toBe(true);
  });
});
