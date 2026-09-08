// WEB LEAF — plain React DOM + Tailwind.
//
// `type="text"` PLUS `role="spinbutton"`, deliberately NOT `type="number"`.
// `input.props.ts` already documents the native number input's traps —
// scroll-to-change, and a bad character collapsing `.value` to `''` with no
// way to tell "empty" from "invalid" — and this component's whole job is
// stepping and clamping a value, so it cannot afford either. A plain text box
// with `inputMode="decimal"` gets the same numeric keyboard on mobile with
// none of the trap.
//
// Reads Field's context exactly as Input does: id, `aria-describedby` and
// `invalid` come from a surrounding `Field.Root` rather than being passed
// twice. Unlike Input it does NOT read InputGroup's context — a spinner
// inside a spinner is not a composition this package offers.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
import { cn } from '../lib/cn';
import {
  DEFAULT_DECREMENT_LABEL,
  DEFAULT_INCREMENT_LABEL,
  DEFAULT_STEP,
  useNumberInputState,
  type NumberInputOwnProps,
} from './number-input.props';

export interface NumberInputProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<'input'>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step'
    >,
    NumberInputOwnProps {}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      step = DEFAULT_STEP,
      disabled = false,
      readOnly = false,
      invalid = false,
      name: nameProp,
      placeholder,
      incrementLabel = DEFAULT_INCREMENT_LABEL,
      decrementLabel = DEFAULT_DECREMENT_LABEL,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const field = React.useContext(FieldContext);
    const state = useNumberInputState({ value, defaultValue, onValueChange, min, max, step });

    const isInvalid = invalid || (field?.invalid ?? false);
    const atMin = state.value !== null && min !== undefined && state.value <= min;
    const atMax = state.value !== null && max !== undefined && state.value >= max;
    const decDisabled = disabled || readOnly || atMin;
    const incDisabled = disabled || readOnly || atMax;

    return (
      <div
        data-state={state.value === null ? 'empty' : 'filled'}
        className={cn(
          'flex h-10 w-full items-stretch overflow-hidden rounded-md border border-line bg-card',
          'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg',
          isInvalid && 'border-danger',
          disabled && 'bg-surface-alt opacity-50',
          className,
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          id={field?.controlId}
          name={nameProp ?? field?.name}
          value={state.text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
          aria-describedby={field?.describedBy}
          aria-invalid={isInvalid ? true : undefined}
          aria-valuenow={state.value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          onChange={(event) => state.setText(event.target.value)}
          onFocus={(event) => {
            state.focus();
            onFocus?.(event);
          }}
          onBlur={(event) => {
            state.commit();
            onBlur?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || disabled || readOnly) return;
            switch (event.key) {
              case 'ArrowUp':
                event.preventDefault();
                state.stepBy('increment', event.shiftKey ? 10 : 1);
                break;
              case 'ArrowDown':
                event.preventDefault();
                state.stepBy('decrement', event.shiftKey ? 10 : 1);
                break;
              case 'Home':
                if (min === undefined) break;
                event.preventDefault();
                state.setValue(min);
                break;
              case 'End':
                if (max === undefined) break;
                event.preventDefault();
                state.setValue(max);
                break;
              case 'Enter':
                state.commit();
                break;
              default:
                break;
            }
          }}
          className={cn(
            'min-w-0 flex-1 border-0 bg-transparent px-sm font-body text-sm text-ink outline-none',
            'placeholder:text-muted disabled:cursor-not-allowed disabled:text-muted',
            'touch-manipulation',
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={decrementLabel}
          disabled={decDisabled}
          onClick={() => state.stepBy('decrement')}
          className={cn(
            'flex w-8 shrink-0 touch-manipulation items-center justify-center border-l border-line',
            'text-sm text-ink hover:bg-surface-alt',
            'disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent',
          )}
        >
          −
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label={incrementLabel}
          disabled={incDisabled}
          onClick={() => state.stepBy('increment')}
          className={cn(
            'flex w-8 shrink-0 touch-manipulation items-center justify-center border-l border-line',
            'text-sm text-ink hover:bg-surface-alt',
            'disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent',
          )}
        >
          +
        </button>
      </div>
    );
  },
);
NumberInput.displayName = 'NumberInput';
