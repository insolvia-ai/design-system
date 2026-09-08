// WEB LEAF — plain React DOM + Tailwind.
//
// Draws Input's own box — `controlBox`, the same border/radius/invalid
// treatment `Input` draws standalone — but on the WRAPPER rather than the
// `<input>`, exactly the way `InputGroup.Root` draws it for an addon
// (`../input-group/input-group.web.tsx`): the toggle button is an addon riding
// INSIDE the box, not a sibling beside it. `focus-within:` carries the ring on
// the wrapper because the thing that actually takes focus is the `<input>`
// inside it; the toggle keeps its OWN `focus-visible` ring (`focusRing`) so a
// keyboard user can tell which of the two controls currently has focus.
//
// Reads Field's context exactly as `Input` does — same id, same
// `aria-describedby`, same invalid fallback — because a password field is
// composed through `<Field.Root>` the same way any other text field is.
//
// Never blocks paste: there is no `onPaste` handler anywhere here, on
// purpose — a password manager or a user pasting a generated password into
// this field must keep working.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
// `controlBox` and `useInputState` are Input's own box classes and
// text-controllability hook, reused rather than reimplemented — see the file
// header.
import { controlBox, useInputState } from '../input/input.props';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  DEFAULT_AUTO_COMPLETE,
  DEFAULT_HIDE_LABEL,
  DEFAULT_SHOW_LABEL,
  useRevealedState,
  type PasswordInputOwnProps,
} from './password-input.props';

export interface PasswordInputProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<'input'>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'autoComplete'
    >,
    PasswordInputOwnProps {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      disabled = false,
      readOnly = false,
      invalid = false,
      name: nameProp,
      placeholder,
      autoComplete = DEFAULT_AUTO_COMPLETE,
      revealed,
      defaultRevealed,
      onRevealedChange,
      showLabel = DEFAULT_SHOW_LABEL,
      hideLabel = DEFAULT_HIDE_LABEL,
      ...props
    },
    ref,
  ) => {
    const field = React.useContext(FieldContext);
    const [text, setText] = useInputState({ value, defaultValue, onValueChange });
    const [isRevealed, setRevealed] = useRevealedState({
      revealed,
      defaultRevealed,
      onRevealedChange,
    });

    const isInvalid = invalid || (field?.invalid ?? false);

    return (
      <div
        data-state={isRevealed ? 'revealed' : 'hidden'}
        className={cn(
          'flex items-center gap-xs',
          controlBox,
          'rounded-md border border-line bg-card',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg',
          isInvalid && 'border-danger',
          disabled && 'bg-surface-alt opacity-50',
          className,
        )}
      >
        <input
          ref={ref}
          type={isRevealed ? 'text' : 'password'}
          id={field?.controlId}
          name={nameProp ?? field?.name}
          // `spellCheck`/`autoCapitalize="off"` — a password is never a
          // sentence, and a browser "correcting" a character in it silently
          // changes what gets submitted.
          spellCheck={false}
          autoCapitalize="off"
          // `current-password` by default (`DEFAULT_AUTO_COMPLETE`, derived
          // from `autoCompleteFor.password` in input.props.ts) — never `off`.
          // See password-input.props.ts for why this is the one input in the
          // package that WANTS a password manager involved.
          autoComplete={autoComplete}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-describedby={field?.describedBy}
          aria-invalid={isInvalid ? true : undefined}
          onChange={(event) => setText(event.target.value)}
          className={cn(
            'h-auto min-w-0 flex-1 border-0 bg-transparent p-0 outline-none',
            'font-body text-ink placeholder:text-muted',
            'disabled:cursor-not-allowed disabled:text-muted',
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setRevealed(!isRevealed)}
          disabled={disabled}
          aria-label={isRevealed ? hideLabel : showLabel}
          aria-pressed={isRevealed}
          // Reachable by keyboard explicitly — this is the one control in the
          // field a Tab press must be able to land on.
          tabIndex={0}
          className={cn(
            'flex shrink-0 items-center justify-center text-muted hover:text-ink',
            'disabled:pointer-events-none disabled:opacity-50',
            focusRing,
            'touch-manipulation',
          )}
        >
          <EyeGlyph revealed={isRevealed} />
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

/**
 * The open eye (hidden state — click to reveal) and the slashed eye (revealed
 * state — click to hide), two paths each. Decorative in every context it is
 * used from: the accessible name lives on the toggle `<button>`, never here,
 * so `aria-hidden` is unconditional.
 */
function EyeGlyph({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-4">
      {revealed ? (
        <>
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <path d="M3 3l18 18" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </>
      ) : (
        <>
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth={1.5} />
        </>
      )}
    </svg>
  );
}
