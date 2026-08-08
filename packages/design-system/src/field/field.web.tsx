// WEB LEAF — plain React DOM + Tailwind. Wires label -> control -> description
// -> error with htmlFor / aria-describedby / aria-invalid. Shares the id scheme
// and describedby rule with the native leaf (field.props); the elements, the
// child-presence scan (keyed off THIS leaf's Description/Error), and the
// render-as-select/textarea escape hatch are web-only.
import * as React from 'react';

import { controlBox } from '../input/input.props';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  FieldContext,
  composeDescribedBy,
  useFieldContext,
  useFieldControlOpen,
  useFieldIds,
  type FieldContextValue,
  type FieldRootOwnProps,
} from './field.props';

export interface FieldRootProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>, FieldRootOwnProps {
  children?: React.ReactNode;
}

const FieldRoot = React.forwardRef<HTMLDivElement, FieldRootProps>(
  ({ className, name, invalid = false, children, ...props }, ref) => {
    const ids = useFieldIds();
    // Provided, not consumed: a plain `position: relative` div with `z-index:
    // auto` starts no stacking context, so the web Select's list already paints
    // over what follows the Field. field.props.ts owns the full reasoning.
    const { controlOpen, setControlOpen } = useFieldControlOpen();

    // Which of description/error are present decides `aria-describedby`.
    let hasDescription = false;
    let hasError = false;
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === FieldDescription) hasDescription = true;
      if (child.type === FieldError) hasError = true;
    });

    const ctx: FieldContextValue = {
      labelId: ids.labelId,
      controlId: ids.controlId,
      describedBy: composeDescribedBy(ids, hasDescription, hasError),
      controlOpen,
      setControlOpen,
      invalid,
      name,
      descriptionId: ids.descriptionId,
      errorId: ids.errorId,
    };

    return (
      <FieldContext.Provider value={ctx}>
        <div ref={ref} className={cn('flex flex-col gap-xs', className)} {...props}>
          {children}
        </div>
      </FieldContext.Provider>
    );
  },
);
FieldRoot.displayName = 'Field.Root';

const FieldLabel = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<'label'>>(
  ({ className, ...props }, ref) => {
    const { controlId, labelId } = useFieldContext('Label');
    return (
      <label
        ref={ref}
        id={labelId}
        htmlFor={controlId}
        className={cn('font-body text-sm font-medium text-ink', className)}
        {...props}
      />
    );
  },
);
FieldLabel.displayName = 'Field.Label';

// The control's chrome, built on the one box every plain text control in the
// package draws (`controlBox`, from input.props). Sharing that constant is
// what stops Field and Input from disagreeing about how tall a text field is —
// they did, at 40 against 44, until the size scale came out.
const controlClass = cn(
  controlBox,
  'rounded-md border border-line bg-card font-body text-ink',
  'placeholder:text-muted',
  focusRing,
  'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted',
  'aria-[invalid=true]:border-danger',
);

export interface FieldControlProps extends Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'children'
> {
  /**
   * The control to wire — REQUIRED.
   *
   * `Field.Control` renders no control of its own. It used to default to a
   * bare `<input>`, which made it a second implementation of `Input` living in
   * the Field folder: same box, same height, and nothing to tell a reader
   * which to reach for. Every control this package ships — `Input`,
   * `Textarea`, `Select`, `DateInput`, `Combobox` — already reads the field's
   * context directly, so the composition to reach for is:
   *
   *     <Field.Root name="callsign">
   *       <Field.Label>Callsign</Field.Label>
   *       <Input />
   *       <Field.Error>Required</Field.Error>
   *     </Field.Root>
   *
   * What is left for this part is the case that composition cannot cover: a
   * control this package does NOT own — a third-party combobox, a hand-rolled
   * `<input>` — which cannot read `FieldContext` because the context is not
   * exported. Hand it here and it gets the id, the name, the
   * `aria-describedby` and the invalid flag, plus the control box.
   */
  render: React.ReactElement<Record<string, unknown>>;
}

const FieldControl = React.forwardRef<HTMLElement, FieldControlProps>(
  ({ className, render, name: nameProp, ...props }, ref) => {
    const { controlId, describedBy, invalid, name } = useFieldContext('Control');

    // A required prop is a compile error for a TS caller; this is for the
    // JavaScript one, and it names the fix rather than rendering nothing.
    if (!render) {
      throw new Error(
        'Field.Control needs a `render` element. It no longer renders an <input> of its own — ' +
          'put a control inside <Field.Root> instead (<Input />, <Select />, …), or pass ' +
          'render={<your-control />} to wire one this package does not own.',
      );
    }

    const childClassName = (render.props.className as string | undefined) ?? undefined;
    return React.cloneElement(render, {
      id: controlId,
      name: nameProp ?? name,
      'aria-describedby': describedBy,
      'aria-invalid': invalid ? true : undefined,
      ...props,
      ref,
      className: cn(controlClass, childClassName, className),
    });
  },
);
FieldControl.displayName = 'Field.Control';

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<'p'>
>(({ className, ...props }, ref) => {
  const { descriptionId } = useFieldContext('Description');
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn('font-body text-sm text-muted', className)}
      {...props}
    />
  );
});
FieldDescription.displayName = 'Field.Description';

export interface FieldErrorProps extends React.ComponentPropsWithoutRef<'p'> {
  /**
   * Accepted for call-site compatibility with the previous Base UI field, where
   * `match` gated the error on a validation state. Here the caller renders the
   * error conditionally, so this is a no-op.
   */
  match?: boolean;
}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, match: _match, ...props }, ref) => {
    const { errorId } = useFieldContext('Error');
    return (
      <p
        ref={ref}
        id={errorId}
        className={cn('font-body text-sm text-danger', className)}
        {...props}
      />
    );
  },
);
FieldError.displayName = 'Field.Error';

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Control: FieldControl,
  Description: FieldDescription,
  Error: FieldError,
};
