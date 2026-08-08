// WEB LEAF — plain React DOM + Tailwind.
//
// Reads Field's context when there is one, exactly as Select and DateInput do:
// the id, the `aria-describedby` string and the invalid flag all come from the
// Field rather than being passed twice. It also reads InputGroup's context, and
// goes `bare` inside one so the group draws a single box around the whole row.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
import { useInputGroup } from '../input-group/input-group.props';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import { autoCompleteFor, controlBox, useInputState, type InputOwnProps } from './input.props';

export interface InputProps
  extends
    Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'defaultValue' | 'onChange' | 'type'>,
    InputOwnProps {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      type = 'text',
      disabled = false,
      invalid = false,
      name: nameProp,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const field = React.useContext(FieldContext);
    const group = useInputGroup();
    const [text, setText] = useInputState({ value, defaultValue, onValueChange });

    const isInvalid = invalid || (field?.invalid ?? false);

    return (
      <input
        ref={ref}
        type={type}
        id={field?.controlId}
        name={nameProp ?? field?.name}
        autoComplete={autoCompleteFor[type]}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={field?.describedBy}
        aria-invalid={isInvalid ? true : undefined}
        onChange={(event) => setText(event.target.value)}
        // Scrolling the page with the pointer over a focused `type="number"`
        // silently changes its value — the trap that nearly kept `number` out
        // of `InputType` altogether. Blurring on wheel disarms it, and costs
        // nothing on every other type because they never react to wheel.
        onWheel={
          type === 'number'
            ? (event) => {
                (event.target as HTMLInputElement).blur();
                props.onWheel?.(event);
              }
            : props.onWheel
        }
        className={cn(
          'font-body text-ink placeholder:text-muted',
          controlBox,
          group
            ? // Inside a group the Root owns the border, the radius and the
              // focus ring — see input-group.props.ts. `h-auto` releases the
              // height too, so the row's own height governs.
              'h-auto min-w-0 flex-1 border-0 bg-transparent outline-none'
            : cn(
                'rounded-md border border-line bg-card',
                focusRing,
                'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted',
                isInvalid && 'border-danger',
              ),
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
