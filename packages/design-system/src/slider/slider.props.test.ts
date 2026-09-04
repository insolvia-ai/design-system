// Direct unit tests for the shared model — the arithmetic and the state machine
// BOTH leaves execute, pinned once here instead of once per platform.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  clampToStep,
  pageStep,
  sliderPercent,
  sliderValueForKey,
  useSliderState,
  valueAtPercent,
} from './slider.props';

describe('sliderPercent', () => {
  it('computes the plain percentage within range', () => {
    expect(sliderPercent(25, 0, 100)).toBe(25);
    expect(sliderPercent(1, 0, 4)).toBe(25);
  });

  it('measures from min, not from zero', () => {
    expect(sliderPercent(15, 10, 20)).toBe(50);
  });

  it('clamps outside the range', () => {
    expect(sliderPercent(150, 0, 100)).toBe(100);
    expect(sliderPercent(-10, 0, 100)).toBe(0);
  });

  it('is 0 for a non-positive range, never a division error', () => {
    expect(sliderPercent(50, 0, 0)).toBe(0);
    expect(sliderPercent(50, 10, 5)).toBe(0);
  });
});

describe('clampToStep', () => {
  it('clamps into the range', () => {
    expect(clampToStep(150, 0, 100, 1)).toBe(100);
    expect(clampToStep(-5, 0, 100, 1)).toBe(0);
  });

  it('snaps to the nearest step measured from min', () => {
    expect(clampToStep(37, 0, 100, 10)).toBe(40);
    expect(clampToStep(12, 5, 25, 10)).toBe(15);
  });

  it('never overshoots max when the range is not a whole number of steps', () => {
    expect(clampToStep(95, 0, 95, 10)).toBe(95);
  });

  it('leaves the value unsnapped when step is non-positive', () => {
    expect(clampToStep(37.4, 0, 100, 0)).toBe(37.4);
    expect(clampToStep(37.4, 0, 100, -1)).toBe(37.4);
  });

  it('keeps fractional steps free of binary-float noise', () => {
    expect(clampToStep(0.3, 0, 1, 0.1)).toBe(0.3);
    expect(clampToStep(0.25, 0, 1, 0.1)).toBe(0.3);
  });

  it('collapses to min for a non-positive range or a non-finite value', () => {
    expect(clampToStep(50, 10, 10, 1)).toBe(10);
    expect(clampToStep(Number.NaN, 3, 100, 1)).toBe(3);
  });
});

describe('valueAtPercent', () => {
  it('turns a track fraction into a snapped value', () => {
    expect(valueAtPercent(50, 0, 100, 1)).toBe(50);
    expect(valueAtPercent(50, 0, 10, 4)).toBe(4);
    expect(valueAtPercent(37, 0, 100, 10)).toBe(40);
  });

  it('clamps a drag that ran off either end of the track', () => {
    expect(valueAtPercent(-20, 0, 100, 1)).toBe(0);
    expect(valueAtPercent(140, 0, 100, 1)).toBe(100);
  });
});

describe('pageStep', () => {
  it('is a tenth of the range', () => {
    expect(pageStep(0, 100, 1)).toBe(10);
  });

  it('is never smaller than one step', () => {
    expect(pageStep(0, 10, 5)).toBe(5);
  });
});

describe('sliderValueForKey', () => {
  it('steps up on ArrowRight and ArrowUp, down on ArrowLeft and ArrowDown', () => {
    expect(sliderValueForKey('ArrowRight', 50, 0, 100, 1)).toBe(51);
    expect(sliderValueForKey('ArrowUp', 50, 0, 100, 1)).toBe(51);
    expect(sliderValueForKey('ArrowLeft', 50, 0, 100, 1)).toBe(49);
    expect(sliderValueForKey('ArrowDown', 50, 0, 100, 1)).toBe(49);
  });

  it('pages by a tenth of the range', () => {
    expect(sliderValueForKey('PageUp', 50, 0, 100, 1)).toBe(60);
    expect(sliderValueForKey('PageDown', 50, 0, 100, 1)).toBe(40);
  });

  it('jumps to the ends on Home and End', () => {
    expect(sliderValueForKey('Home', 50, 10, 90, 1)).toBe(10);
    expect(sliderValueForKey('End', 50, 10, 90, 1)).toBe(90);
  });

  it('stops at the ends rather than wrapping', () => {
    expect(sliderValueForKey('ArrowRight', 100, 0, 100, 1)).toBe(100);
    expect(sliderValueForKey('ArrowLeft', 0, 0, 100, 1)).toBe(0);
  });

  it("claims nothing else — Tab and Enter are the page's", () => {
    expect(sliderValueForKey('Tab', 50, 0, 100, 1)).toBeNull();
    expect(sliderValueForKey('Enter', 50, 0, 100, 1)).toBeNull();
    expect(sliderValueForKey('a', 50, 0, 100, 1)).toBeNull();
  });
});

const options = { min: 0, max: 100, step: 1, disabled: false };

describe('useSliderState', () => {
  it('starts at min without a defaultValue', () => {
    const { result } = renderHook(() => useSliderState({ ...options, min: 10 }));

    expect(result.current.value).toBe(10);
    expect(result.current.percent).toBe(0);
  });

  it('honours defaultValue on first render, snapped', () => {
    const { result } = renderHook(() => useSliderState({ ...options, defaultValue: 37, step: 10 }));

    expect(result.current.value).toBe(40);
  });

  it('moves uncontrolled state and fires onValueChange', () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() => useSliderState({ ...options, onValueChange }));

    act(() => result.current.setValue(30));

    expect(result.current.value).toBe(30);
    expect(result.current.percent).toBe(30);
    expect(onValueChange).toHaveBeenCalledWith(30);
  });

  it('defers to the controlled value and only reports the requested change', () => {
    const onValueChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useSliderState({ ...options, value, onValueChange }),
      { initialProps: { value: 20 } },
    );

    act(() => result.current.setValue(30));

    expect(result.current.value).toBe(20);
    expect(onValueChange).toHaveBeenCalledWith(30);

    rerender({ value: 30 });
    expect(result.current.value).toBe(30);
  });

  it('snaps a controlled value on the way in', () => {
    const { result } = renderHook(() => useSliderState({ ...options, value: 37, step: 10 }));

    expect(result.current.value).toBe(40);
  });

  it('reports nothing for a move that lands on the value it already holds', () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSliderState({ ...options, defaultValue: 40, step: 10, onValueChange }),
    );

    act(() => result.current.setValue(42));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('nudges by whole steps', () => {
    const { result } = renderHook(() => useSliderState({ ...options, defaultValue: 40, step: 10 }));

    act(() => result.current.nudge(1));
    expect(result.current.value).toBe(50);

    act(() => result.current.nudge(-2));
    expect(result.current.value).toBe(30);
  });

  it('commits once per interaction that moved the value', () => {
    const onValueCommit = vi.fn();
    const { result } = renderHook(() => useSliderState({ ...options, onValueCommit }));

    act(() => result.current.setValue(30));
    act(() => result.current.setValue(60));
    act(() => result.current.commit());

    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith(60);

    // A second end-of-interaction with nothing moved in between is silent.
    act(() => result.current.commit());
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });

  it('never commits for an interaction that moved nothing', () => {
    const onValueCommit = vi.fn();
    const { result } = renderHook(() => useSliderState({ ...options, onValueCommit }));

    act(() => result.current.commit());

    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it('never moves, and never reports, when disabled', () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const { result } = renderHook(() =>
      useSliderState({ ...options, disabled: true, onValueChange, onValueCommit }),
    );

    act(() => result.current.setValue(30));
    act(() => result.current.commit());

    expect(result.current.value).toBe(0);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it('reports a buffered percentage only when there is one', () => {
    const { result: without } = renderHook(() => useSliderState(options));
    expect(without.current.bufferedPercent).toBeNull();

    const { result: with_ } = renderHook(() => useSliderState({ ...options, buffered: 70 }));
    expect(with_.current.bufferedPercent).toBe(70);
  });
});
