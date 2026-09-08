// WEB LEAF — plain React DOM + Tailwind.
//
// N real `<input>`s, one per box — the Chakra `PinInput` shape — rather than
// one hidden field with drawn boxes the way the native leaf does it. A web
// consumer's SMS autofill (`autoComplete="one-time-code"`) and a browser's own
// "paste code here" affordance both target a real, individually focusable
// text field, and each box needs its own `aria-label` ("Digit 3 of 6") for a
// screen reader to say where it is — neither works behind one shared control.
// The native leaf's reasons for the opposite choice are in ITS header; the two
// platforms are not disagreeing, they are each doing what their own a11y and
// autofill APIs actually reward.
//
// MASKING uses `[-webkit-text-security:disc]`, not `type="password"`. A
// `type="password"` box is exactly what triggers a browser's or a password
// manager's save-a-password prompt — wrong for a one-time code, which is
// never a credential to remember. `text-security` paints the same dots with
// no such side effect; it is WebKit/Blink-only, which this package accepts
// for the same reason `slider.web.tsx`'s track fill does.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  acceptChar,
  deleteAt,
  distributePaste,
  nextIndex,
  normalizeChar,
  prevIndex,
  setCharAt,
  usePinInputState,
  type PinInputOwnProps,
} from './pin-input.props';

export interface PinInputProps
  extends
    Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>,
    PinInputOwnProps {}

export const PinInput = React.forwardRef<HTMLDivElement, PinInputProps>(
  (
    {
      className,
      length = 6,
      value: valueProp,
      defaultValue,
      onValueChange,
      onComplete,
      type = 'numeric',
      mask = false,
      disabled = false,
      invalid = false,
      name,
      autoFocus = false,
      label = 'Verification code',
      ...props
    },
    ref,
  ) => {
    const field = React.useContext(FieldContext);
    const [value, setValue] = usePinInputState({
      length,
      value: valueProp,
      defaultValue,
      onValueChange,
      onComplete,
    });

    const isInvalid = invalid || (field?.invalid ?? false);

    const boxesRef = React.useRef<(HTMLInputElement | null)[]>([]);
    const focusBox = (index: number) => boxesRef.current[index]?.focus();

    // Mount only. Refocusing on every render (an exhaustive dep on `value`
    // would do that) would steal focus back from whatever the person tabbed
    // to next — `autoFocus`'s own doc in pin-input.props.ts says this is a
    // one-time, whole-screen decision, not a standing claim on focus.
    React.useEffect(() => {
      if (autoFocus) focusBox(Math.min(value.length, length - 1));
      // Intentionally empty deps — mount only, see the comment above.
    }, []);

    const handleChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      // Empty means the browser just cleared the box (a select-all
      // Backspace, or a deleted selection) — deletion is `handleKeyDown`'s
      // job, this handler only ever ADDS a character.
      if (raw === '') return;
      const ch = raw.slice(-1);
      if (!acceptChar(type, ch)) {
        // Reject imperatively: this input is controlled by `value` below, but
        // React only resets the DOM back to that value on a re-render, and
        // nothing here triggers one for a keystroke we're refusing to apply.
        event.target.value = value[index] ?? '';
        return;
      }
      const next = setCharAt(value, index, normalizeChar(type, ch));
      setValue(next);
      if (index < length - 1) focusBox(nextIndex(index, length));
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        event.preventDefault();
        if ((value[index] ?? '') !== '') {
          // This box holds a character: clear it and stay — the distinct
          // "still on this box" case pin-input.props.ts's header calls out.
          setValue(deleteAt(value, index));
          return;
        }
        // Nothing here to delete: step back and clear THAT box instead.
        const target = prevIndex(index);
        setValue(deleteAt(value, target));
        focusBox(target);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        focusBox(prevIndex(index));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        focusBox(nextIndex(index, length));
      }
    };

    const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const next = distributePaste(value, index, event.clipboardData.getData('text'), length, type);
      if (next === value) return;
      setValue(next);
      focusBox(Math.min(next.length, length - 1));
    };

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cn('inline-flex gap-sm', className)}
        {...props}
      >
        {Array.from({ length }, (_, index) => {
          const ch = value[index] ?? '';
          return (
            <input
              // The index IS this box's identity — positional, never a data
              // list that reorders — so it is the right key here.
              key={index}
              ref={(node) => {
                boxesRef.current[index] = node;
              }}
              type="text"
              inputMode={type === 'numeric' ? 'numeric' : 'text'}
              maxLength={1}
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${index + 1} of ${length}`}
              aria-invalid={isInvalid ? true : undefined}
              spellCheck={false}
              autoCapitalize={type === 'alphanumeric' ? 'characters' : 'off'}
              disabled={disabled}
              value={ch}
              data-state={ch === '' ? 'empty' : 'filled'}
              // Selects the box's existing character on focus so the very
              // next keystroke overwrites it. Without this, `maxLength={1}`
              // blocks a second keystroke outright — the browser enforces the
              // limit by refusing to INSERT past it, and refuses even when
              // the caller's intent is plainly "replace what's there".
              onFocus={(event) => event.target.select()}
              onChange={(event) => handleChange(index, event)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              className={cn(
                'size-10 rounded-md border border-line bg-card text-center font-mono text-lg tabular-nums text-ink',
                'touch-manipulation',
                focusRing,
                mask && '[-webkit-text-security:disc]',
                isInvalid && 'border-danger',
                disabled && 'cursor-not-allowed bg-surface-alt text-muted',
              )}
            />
          );
        })}
        {/* A real form control so an ordinary form post carries the joined
            code — the boxes above are each one character and cannot. Omitted
            entirely when there is no name to submit, matching Select. */}
        {name === undefined ? null : <input type="hidden" name={name} value={value} />}
      </div>
    );
  },
);
PinInput.displayName = 'PinInput';
