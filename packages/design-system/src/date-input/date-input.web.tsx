// WEB LEAF — plain React DOM + Tailwind. A masked text input with a button on
// its right that opens `DatePicker`'s wheels in an anchored surface.
//
// NOT `<input type="date">`. The browser control renders a calendar the native
// leaf cannot match, formats to the browser's locale rather than the one the
// form asks for, and is the one input whose appearance cannot be styled
// consistently. This is that control's shape — field, icon, popup — built out
// of parts both platforms have.
//
// The surface is inline and absolutely positioned, like Select's list rather
// than Dialog's portal, and it is NOT composed from `Popover`: Popover.Root
// hard-codes `inline-flex` with no way through for a full-width field, and its
// native leaf has no press-outside dismissal. Select already solved this exact
// problem, including the Field stacking fix, so this follows Select.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
// Explicit `.web`, never the extensionless `'../date-picker'` — see the note in
// date-picker.web.tsx for why one specifier cannot resolve two ways.
import { DatePicker } from '../date-picker/date-picker.web';
import { PickerIcon } from './date-input-icon.web';
import {
  isErrorStatus,
  OPEN_LABEL,
  resolveFormat,
  useDateInputState,
  type DateInputOwnProps,
} from './date-input.props';

// `min`/`max` are Omit-ed from the input props because React declares them as
// `string | number` for numeric and native-date inputs, and here they are
// strings the shared range check compares lexicographically — the date meaning
// has to win. Same reasoning as Tabs.Root's `defaultValue`.
export interface DateInputProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<'input'>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max'
    >,
    DateInputOwnProps {
  /**
   * Replaces the drawn icon. The default is a calendar (or a clock, for
   * `mode="time"`) built out of bordered boxes, because React Native renders no
   * SVG without a dependency this package is forbidden to declare — see `ICON`
   * in date-input.props.ts. A consumer with an icon set of its own passes it
   * here.
   */
  icon?: React.ReactNode | undefined;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      mode = 'date',
      format,
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      minuteInterval = 1,
      hourCycle = 24,
      today,
      disabled = false,
      name: nameProp,
      icon,
      placeholder,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const field = React.useContext(FieldContext);
    const state = useDateInputState({
      mode,
      format,
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      today,
    });
    const {
      text,
      setText,
      status,
      value: current,
      open,
      setOpen,
      pick,
      pickerValue,
      rootId,
    } = state;

    const invalid = isErrorStatus(status) || (field?.invalid ?? false);
    const name = nameProp ?? field?.name;
    const surfaceId = `${rootId}-picker`;
    const rootRef = React.useRef<HTMLDivElement | null>(null);

    // Pressing anywhere outside closes without committing anything — the
    // behaviour of every native date control, and the reason this listens on
    // `mousedown` rather than `click`: a press that starts outside and ends
    // inside should still count as leaving.
    React.useEffect(() => {
      if (!open) return undefined;
      const onPointerDown = (event: MouseEvent) => {
        if (rootRef.current?.contains(event.target as Node)) return;
        setOpen(false);
      };
      document.addEventListener('mousedown', onPointerDown);
      return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open, setOpen]);

    return (
      <div
        ref={rootRef}
        className="relative w-full"
        onKeyDown={(event) => {
          // Escape closes. Handled on the ROOT rather than on the surface,
          // because opening the picker does not move focus — it is still in
          // the text field — so a handler bound to the surface would never see
          // the keystroke. Popover's web leaf records the same trap.
          if (event.defaultPrevented || !open) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
          }
        }}
      >
        <input
          ref={ref}
          type="text"
          id={field?.controlId}
          // `numeric` rather than `decimal` or `tel`: it puts a digit keypad on
          // a phone without offering a decimal point this can never accept.
          inputMode="numeric"
          // A date is not a thing browsers should be filling from a saved
          // address, and an autofilled value would bypass the mask entirely.
          autoComplete="off"
          value={text}
          placeholder={placeholder ?? resolveFormat(mode, format)}
          disabled={disabled}
          aria-describedby={field?.describedBy}
          aria-invalid={invalid ? true : undefined}
          onChange={(event) => setText(event.target.value)}
          onBlur={(event) => {
            onBlur?.(event);
            // Focus leaving the widget entirely closes the picker. A press on a
            // wheel row cannot get here — the rows preventDefault their own
            // mousedown so the field never blurs.
            if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
          }}
          className={cn(
            // `h-11` (44px) to match the native leaf, which has always been 44
            // — see select.web.tsx for the target-size rule and why
            // Field.Control stays 40. `pr-11` leaves the button its own room
            // rather than letting text run underneath it.
            'h-11 w-full rounded-md border border-line bg-card py-sm pl-sm pr-11 font-body text-sm text-ink',
            'placeholder:text-muted',
            focusRing,
            'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted',
            invalid && 'border-danger',
            className,
          )}
          {...props}
        />

        <button
          type="button"
          // The button is what a screen reader announces, so it carries the
          // whole intent; the glyph beside it is decorative.
          aria-label={OPEN_LABEL[mode]}
          aria-haspopup="dialog"
          aria-expanded={open}
          // Only while the surface exists: it must name an element that is there.
          aria-controls={open ? surfaceId : undefined}
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            'absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-md text-muted',
            'hover:text-ink disabled:cursor-not-allowed disabled:text-muted',
            focusRing,
          )}
        >
          <span aria-hidden="true" className="flex items-center justify-center">
            {icon ?? <PickerIcon mode={mode} />}
          </span>
        </button>

        {open && (
          <div
            id={surfaceId}
            // A non-modal surface: `role="dialog"` WITHOUT `aria-modal`, which
            // would tell a screen reader the rest of the page is inert while
            // every control behind it is demonstrably still usable.
            role="dialog"
            aria-label={OPEN_LABEL[mode]}
            // Keeping mousedown from doing its default is what stops the field
            // blurring when a wheel row is pressed — without it the blur
            // handler closes the picker before the press lands.
            onMouseDown={(event) => event.preventDefault()}
            className="absolute left-0 top-full z-10 mt-xs"
          >
            <DatePicker
              mode={mode}
              value={pickerValue}
              onValueChange={pick}
              {...(min === undefined ? {} : { min })}
              {...(max === undefined ? {} : { max })}
              minuteInterval={minuteInterval}
              hourCycle={hourCycle}
              {...(today === undefined ? {} : { today })}
              className="shadow-lg"
            />
          </div>
        )}

        {/* The visible input carries no name on purpose: mid-typing its value
            is "2019-0", and a form post should never receive that. What is
            submitted is the complete value or nothing at all. */}
        {name === undefined ? null : <input type="hidden" name={name} value={current} />}
      </div>
    );
  },
);
DateInput.displayName = 'DateInput';
