// WEB LEAF — plain React DOM + Tailwind. Field- and InputGroup-aware on the
// same terms as Input.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
import { useInputGroup } from '../input-group/input-group.props';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import { useTextareaState, type TextareaOwnProps } from './textarea.props';

export interface TextareaProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<'textarea'>,
      'value' | 'defaultValue' | 'onChange' | 'rows'
    >,
    TextareaOwnProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      rows = 3,
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
    const [text, setText] = useTextareaState({ value, defaultValue, onValueChange });

    const isInvalid = invalid || (field?.invalid ?? false);

    return (
      <textarea
        ref={ref}
        id={field?.controlId}
        name={nameProp ?? field?.name}
        rows={rows}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={field?.describedBy}
        aria-invalid={isInvalid ? true : undefined}
        onChange={(event) => setText(event.target.value)}
        className={cn(
          // `resize-y`, not `resize`: horizontal resizing breaks the form's
          // column and has no native counterpart at all, so allowing it would
          // be a divergence a consumer could drag into existence.
          'w-full resize-y px-sm py-sm font-body text-sm text-ink placeholder:text-muted',
          group
            ? 'min-w-0 flex-1 border-0 bg-transparent outline-none'
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
Textarea.displayName = 'Textarea';
