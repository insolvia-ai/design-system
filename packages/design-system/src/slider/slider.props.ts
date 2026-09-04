// SHARED — `react` and `../lib/controllable` only. No react-dom, no
// react-native.
//
// The slider's whole model: the value/percent arithmetic both leaves paint
// from, the step snapping every entry point funnels through, the keyboard
// grammar, and the controlled/uncontrolled state. The leaves render an
// `<input type="range">` or a View with a drag responder, and nothing else.
//
// WHY `Slider` IS ONE COMPONENT AND `Progress` IS THREE. Progress is compound
// because its Track and Indicator are real, separately-styleable boxes a caller
// can put things between. A slider's track and thumb are NOT boxes on the web:
// the leaf is a native `<input type="range">`, whose track and thumb are
// `::-webkit-slider-runnable-track` / `::-moz-range-thumb` pseudo-elements —
// they cannot be React children, cannot take a ref, and cannot be handed to a
// caller. A `Slider.Thumb` that rendered nothing and only re-styled a
// pseudo-element would be a part in name only, and the native leaf would then
// have to fake the same empty shape to keep one API. So: one element, one
// component, `label` instead of a `Slider.Label` part. Progress's shape is
// mirrored where it is real — the semantic roles, the percent maths and the
// pill track are the same design.
//
// WHY THE KEYBOARD IS OURS AND NOT THE BROWSER'S. The web leaf is a native
// range input, which arrives with arrow-key stepping already implemented — and
// it still calls `sliderValueForKey` and `preventDefault()`s the browser's
// version. Two reasons. The engines disagree about the edges (Home/End and
// PageUp/PageDown are not specified for a range and are not implemented alike),
// and the native leaf has no browser to inherit anything from — its
// increment/decrement accessibility actions have to come from somewhere. One
// shared function is what makes the two platforms step identically instead of
// approximately.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export interface SliderOwnProps {
  // `| undefined` on every optional is required, not noise:
  // `exactOptionalPropertyTypes` is on, and without it a leaf cannot spread a
  // possibly-undefined prop through. Same note as input.props.ts.
  /** Controlled position. Pair with `onValueChange`. Clamped and snapped. */
  value?: number | undefined;
  /** Uncontrolled starting position. Defaults to `min`. */
  defaultValue?: number | undefined;
  /** Fires with the value the slider *wants*, in both modes, per movement. */
  onValueChange?: ((next: number) => void) | undefined;
  /**
   * Fires ONCE when an interaction that moved the value ends — pointer up, key
   * up, or blur mid-drag. For the caller that wants to scrub a video's fill
   * live but only seek on release: `onValueChange` paints, `onValueCommit`
   * seeks. An interaction that moved nothing fires nothing, so releasing a
   * click on the thumb, or tabbing away, is silent.
   */
  onValueCommit?: ((value: number) => void) | undefined;
  /** Defaults to 0. */
  min?: number | undefined;
  /** Defaults to 100. */
  max?: number | undefined;
  /** Granularity, defaults to 1. A non-positive step disables snapping. */
  step?: number | undefined;
  /**
   * A secondary fill drawn BEHIND the primary one, in the same units as
   * `value` — a video's buffered-ahead position. Purely visual: it is not
   * announced, not a bound on `value`, and never moved by an interaction.
   */
  buffered?: number | undefined;
  /**
   * The accessible name. Required — a slider announcing a number and no name
   * is a number from nowhere, and neither leaf renders visible text of its own
   * to fall back on.
   */
  label: string;
  disabled?: boolean | undefined;
}

/**
 * Trim binary-float noise without pinning a scale: twelve significant digits
 * is far past any slider's resolution and far short of a double's, so
 * `0.1 + 0.2` lands on `0.3` and a value in the millions survives intact.
 */
function tidy(value: number): number {
  return Number(value.toPrecision(12));
}

/**
 * A value clamped into [min, max] and snapped to the nearest `step` measured
 * FROM `min` (not from zero — a [5, 25] range stepping by 10 offers 5/15/25).
 *
 * A non-positive `step` means no snapping, only clamping. A non-positive range
 * (`max <= min`) collapses to `min`, and a non-finite input does too rather
 * than propagating `NaN` into a style string.
 */
export function clampToStep(value: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(value)) return min;
  if (max <= min) return min;
  const bounded = Math.min(max, Math.max(min, value));
  if (step <= 0) return tidy(bounded);
  const snapped = min + Math.round((bounded - min) / step) * step;
  // Snapping can overshoot when the range is not a whole number of steps —
  // [0, 95] by 10 rounds 95 up to 100 — so the clamp is applied again after.
  return tidy(Math.min(max, Math.max(min, snapped)));
}

/**
 * The fill percentage for a value within [min, max], clamped to [0, 100]. A
 * non-positive range reports 0 rather than dividing by zero — the same
 * contract as `meterPercent`, kept separate for the same reason Meter kept its
 * own: coupling two components' state shapes to share four lines of arithmetic
 * costs more than the duplication.
 */
export function sliderPercent(value: number, min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 0;
  return Math.min(100, Math.max(0, ((value - min) / range) * 100));
}

/**
 * The value a fraction of the way along the track — how a drag or a track press
 * becomes a number. Snapped, so a gesture lands on the same values the keyboard
 * can reach.
 */
export function valueAtPercent(percent: number, min: number, max: number, step: number): number {
  if (max <= min) return min;
  return clampToStep(min + (percent / 100) * (max - min), min, max, step);
}

/**
 * One page of travel: a tenth of the range, never smaller than a single step.
 * PageUp/PageDown move by this.
 */
export function pageStep(min: number, max: number, step: number): number {
  return Math.max(step > 0 ? step : 1, (max - min) / 10);
}

/**
 * The value a key asks for, or `null` for a key this control does not claim.
 *
 * Both directions are bound the way APG binds them for a horizontal slider:
 * Up and Right increase, Down and Left decrease. `null` is what tells the web
 * leaf to leave the event alone — without it, preventing the default on every
 * keydown would swallow Tab.
 */
export function sliderValueForKey(
  key: string,
  current: number,
  min: number,
  max: number,
  step: number,
): number | null {
  const unit = step > 0 ? step : 1;
  const page = pageStep(min, max, step);

  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clampToStep(current + unit, min, max, step);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampToStep(current - unit, min, max, step);
    case 'PageUp':
      return clampToStep(current + page, min, max, step);
    case 'PageDown':
      return clampToStep(current - page, min, max, step);
    case 'Home':
      return min;
    case 'End':
      return clampToStep(max, min, max, step);
    default:
      return null;
  }
}

export interface SliderStateOptions extends Pick<
  SliderOwnProps,
  'value' | 'defaultValue' | 'onValueChange' | 'onValueCommit' | 'buffered'
> {
  min: number;
  max: number;
  step: number;
  disabled: boolean;
}

export interface SliderState {
  /** The clamped, snapped value both leaves render and announce. */
  value: number;
  /** Where the primary fill ends, in percent of the track. */
  percent: number;
  /** Where the buffered fill ends, or `null` when there is no `buffered`. */
  bufferedPercent: number | null;
  /** Ask for a value. Clamps, snaps, and reports only an actual movement. */
  setValue: (next: number) => void;
  /** Move by whole steps — the native leaf's increment/decrement actions. */
  nudge: (steps: number) => void;
  /** End the interaction. Fires `onValueCommit` only if the value moved. */
  commit: () => void;
}

/**
 * The slider's state machine — pure React, identical on both platforms. A
 * disabled slider never moves and never reports anything, in either mode.
 */
export function useSliderState({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  buffered,
  min,
  max,
  step,
  disabled,
}: SliderStateOptions): SliderState {
  const [current, setCurrent] = useControllableState<number>(
    // A controlled value is snapped on the way IN as well as on the way out,
    // so a parent that stores 37.4 against a step of 5 sees the same 35 the
    // keyboard would produce rather than a thumb that sits between its own
    // stops.
    value === undefined ? undefined : clampToStep(value, min, max, step),
    clampToStep(defaultValue ?? min, min, max, step),
    onValueChange,
  );

  // What the slider last moved TO, readable synchronously. `commit` runs in the
  // event that ENDS a gesture, which on the web is a different event from the
  // one that last moved it — reading component state there would report the
  // render before last on a fast drag.
  const latest = React.useRef(current);
  React.useEffect(() => {
    latest.current = current;
  }, [current]);

  // Set by any movement, cleared by the commit that reports it: one commit per
  // interaction that changed something, and none for an interaction that did
  // not. Kept in a ref rather than state because flipping it must not re-render.
  const moved = React.useRef(false);

  const onValueCommitRef = React.useRef(onValueCommit);
  React.useEffect(() => {
    onValueCommitRef.current = onValueCommit;
  });

  const setValue = React.useCallback(
    (next: number) => {
      if (disabled) return;
      const snapped = clampToStep(next, min, max, step);
      if (snapped === current) return;
      latest.current = snapped;
      moved.current = true;
      setCurrent(snapped);
    },
    [current, disabled, max, min, setCurrent, step],
  );

  const nudge = React.useCallback(
    (steps: number) => {
      setValue(current + steps * (step > 0 ? step : 1));
    },
    [current, setValue, step],
  );

  const commit = React.useCallback(() => {
    if (disabled || !moved.current) return;
    moved.current = false;
    onValueCommitRef.current?.(latest.current);
  }, [disabled]);

  const percent = sliderPercent(current, min, max);
  const bufferedPercent = buffered === undefined ? null : sliderPercent(buffered, min, max);

  return React.useMemo(
    () => ({ value: current, percent, bufferedPercent, setValue, nudge, commit }),
    [bufferedPercent, commit, current, nudge, percent, setValue],
  );
}
