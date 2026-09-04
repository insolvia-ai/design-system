// WEB LEAF — plain React DOM + Tailwind over a native `<input type="range">`.
//
// The element is a real range input because that is the only way to get the
// browser's own `role="slider"`, its value announcements and its pointer
// dragging — including the drag that continues outside the control — without
// reimplementing any of it. What this leaf adds is the paint, and the paint is
// the entire reason the component exists: `appearance-none` strips the OS
// control, and the vendor track/thumb pseudo-elements are restyled to the
// package's semantic roles.
//
// TWO RULES ABOUT THE CLASS STRINGS BELOW, both load-bearing.
//
// 1. Every class is a WHOLE LITERAL. A consumer's Tailwind scanner reads this
//    file as text and cannot evaluate anything, so a class assembled from a
//    template literal compiles to no CSS in the consumer's build while looking
//    perfectly correct here. The arbitrary variants are long and repetitive for
//    exactly this reason; they are not a candidate for a helper that builds
//    them.
// 2. The two percentages are therefore NOT in a class. They ride in on an
//    inline CSS custom property that the pseudo-elements inherit, and the
//    arbitrary-property utility below reads it. Colours inside that gradient
//    are the semantic custom properties, so dark mode follows through
//    `theme.css` alone — nothing here branches on a scheme.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import { sliderValueForKey, useSliderState, type SliderOwnProps } from './slider.props';

/**
 * The track's fill, as one gradient with hard stops: primary up to the value,
 * the `line` mid step up to the buffered position, then nothing — the
 * `bg-surface-alt` under it is the empty remainder, so the gradient never has
 * to name the base colour.
 *
 * A buffered position behind the value is clamped forward: CSS would collapse
 * the out-of-order stop anyway, and saying so here beats relying on it.
 */
function fillGradient(percent: number, bufferedPercent: number | null): string {
  const buffered = Math.max(percent, bufferedPercent ?? 0);
  return [
    'linear-gradient(to right,',
    `var(--color-primary) 0%, var(--color-primary) ${percent}%,`,
    `var(--color-line) ${percent}%, var(--color-line) ${buffered}%,`,
    `transparent ${buffered}%)`,
  ].join(' ');
}

// The webkit/blink pseudo-elements. `appearance-none` on the thumb is what
// lets it be sized at all, and the negative top margin re-centres it on the
// track: (track 8px - thumb 16px) / 2 = -4px.
const WEBKIT_TRACK =
  '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:rounded-pill [&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-surface-alt [&::-webkit-slider-runnable-track]:[background-image:var(--ds-slider-fill)]';

const WEBKIT_THUMB =
  '[&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-pill [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm';

// Gecko's equivalents. It centres its own thumb, so there is no margin here —
// and `::-moz-range-progress` is deliberately NOT used: it would paint a second
// fill on top of the gradient, and only in one engine.
const MOZ_TRACK =
  '[&::-moz-range-track]:h-2 [&::-moz-range-track]:w-full [&::-moz-range-track]:rounded-pill [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-surface-alt [&::-moz-range-track]:[background-image:var(--ds-slider-fill)]';

const MOZ_THUMB =
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-pill [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm';

// `value`/`defaultValue`/`onChange` are Omit-ed because this component's own
// number-shaped versions must win over React's form-control types, and
// `min`/`max`/`step` because React types them `string | number` while the
// arithmetic here needs numbers.
export interface SliderProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<'input'>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step'
    >,
    SliderOwnProps {}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      style,
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      buffered,
      label,
      disabled = false,
      onKeyDown,
      onKeyUp,
      onPointerUp,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const state = useSliderState({
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      buffered,
      min,
      max,
      step,
      disabled,
    });

    // React's CSSProperties has no index signature, so a custom property needs
    // the cast. Contained to this one line, and the caller's `style` still wins
    // over it.
    const fill = { '--ds-slider-fill': fillGradient(state.percent, state.bufferedPercent) };

    return (
      <input
        ref={ref}
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step > 0 ? step : 'any'}
        value={state.value}
        disabled={disabled}
        // `data-buffered` is the buffered position as a percentage, or absent.
        // It is what a test and a consumer's own CSS can see: the gradient
        // itself is one opaque string, so without this there is no observable
        // difference between a buffered slider and an unbuffered one.
        data-buffered={state.bufferedPercent === null ? undefined : state.bufferedPercent}
        onChange={(event) => state.setValue(Number(event.target.value))}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || disabled) return;
          const next = sliderValueForKey(event.key, state.value, min, max, step);
          if (next === null) return;
          // The browser steps a range input as the DEFAULT ACTION of this
          // keydown, so preventing it is what stops the value moving twice —
          // once by the engine's rules and once by ours. See slider.props.ts
          // for why ours is worth having at all.
          event.preventDefault();
          state.setValue(next);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          state.commit();
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          state.commit();
        }}
        // The safety net for a drag that ends somewhere this element never
        // hears about — the pointer released over another window, or focus
        // pulled away mid-gesture. `commit` is idempotent per movement, so a
        // blur after a committed keystroke is silent.
        onBlur={(event) => {
          onBlur?.(event);
          state.commit();
        }}
        style={{ ...(fill as React.CSSProperties), ...style }}
        className={cn(
          'h-6 w-full cursor-pointer appearance-none bg-transparent',
          WEBKIT_TRACK,
          WEBKIT_THUMB,
          MOZ_TRACK,
          MOZ_THUMB,
          focusRing,
          disabledStyles,
          className,
        )}
        {...props}
      />
    );
  },
);
Slider.displayName = 'Slider';
