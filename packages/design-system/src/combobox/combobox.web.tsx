// WEB LEAF — plain React DOM + Tailwind. The APG combobox-with-list-
// autocomplete pattern: a text `<input role="combobox">` that keeps focus the
// whole time, plus a `role="listbox"` popup addressed through
// `aria-activedescendant`. Focus never enters the list, which is what lets the
// caret stay where the user is typing.
//
// Everything about WHICH options are shown and what a key means lives in
// combobox.props, shared verbatim with the native leaf. Reads Field's context
// when there is one, exactly as Select and Input do.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import { getListboxId, getOptionId } from '../select/select.props';
import {
  comboboxKeyIntent,
  DEFAULT_EMPTY_MESSAGE,
  useComboboxState,
  type ComboboxOwnProps,
} from './combobox.props';

export interface ComboboxProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<'input'>,
      'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
    >,
    ComboboxOwnProps {}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      className,
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder,
      disabled = false,
      invalid = false,
      name: nameProp,
      emptyMessage = DEFAULT_EMPTY_MESSAGE,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const field = React.useContext(FieldContext);
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const state = useComboboxState({ options, value, defaultValue, onValueChange });
    const { query, setQuery, visible, open, setOpen, active, setActive, commit, revert, rootId } =
      state;

    const isInvalid = invalid || (field?.invalid ?? false);
    const name = nameProp ?? field?.name;
    const listboxId = getListboxId(rootId);
    // Expanded means "there is a listbox to move into". With every option
    // filtered out there is nothing to expand into, and claiming otherwise
    // would point `aria-controls` at an element that does not exist.
    const listOpen = open && visible.length > 0;
    const showEmpty = open && visible.length === 0;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const intent = comboboxKeyIntent(event.key, event.altKey, { open, visible, active });
      if (intent.kind === 'none') return;
      // Tab must keep moving focus; everything else here would otherwise
      // scroll the page or submit the form.
      if (event.key !== 'Tab') event.preventDefault();

      switch (intent.kind) {
        case 'open':
          setOpen(true);
          setActive(intent.active);
          break;
        case 'revert':
          revert();
          break;
        case 'active':
          setActive(intent.active);
          break;
        case 'commit':
          commit(intent.value);
          break;
      }
    };

    return (
      <div ref={rootRef} className="relative">
        <input
          ref={ref}
          type="text"
          role="combobox"
          id={field?.controlId}
          // `list` — the popup offers completions but nothing is written into
          // the box until the user commits one. `both` would promise inline
          // completion this does not do.
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listboxId}
          // Only while the list exists: it must name an element that is there.
          aria-activedescendant={
            listOpen && active !== null ? getOptionId(rootId, active) : undefined
          }
          aria-describedby={field?.describedBy}
          aria-invalid={isInvalid ? true : undefined}
          // A combobox's own list IS the completion; a browser dropdown on top
          // of it covers the options this renders.
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            onBlur?.(event);
            // Focus leaving the widget discards uncommitted text — the same
            // rule Escape and Tab follow. Clicking an option cannot get here:
            // the list preventDefaults its own mousedown.
            if (!rootRef.current?.contains(event.relatedTarget as Node | null)) revert();
          }}
          className={cn(
            // `h-11` (44px), the WCAG 2.5.5 target-size floor the Select
            // trigger and DateInput already hold.
            'h-11 w-full rounded-md border border-line bg-card px-sm font-body text-sm text-ink',
            'placeholder:text-muted',
            focusRing,
            'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted',
            isInvalid && 'border-danger',
            className,
          )}
          {...props}
        />

        {/* A real form control so an ordinary form post carries the COMMITTED
            value — never the half-typed query, which is what the visible input
            holds. Same reasoning as DateInput's hidden input. */}
        {name === undefined ? null : <input type="hidden" name={name} value={state.value ?? ''} />}

        {listOpen && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined}
            // Keeping mousedown from doing its default is what stops the input
            // blurring when an option is clicked — without it the blur handler
            // reverts the query before the click lands.
            onMouseDown={(event) => event.preventDefault()}
            className={cn(
              'absolute z-10 mt-xs max-h-60 w-full overflow-auto rounded-md border border-line bg-card py-xs',
              'font-body text-sm text-ink shadow-lg',
            )}
          >
            {visible.map((option) => {
              const isSelected = option.value === state.value;
              return (
                <li
                  key={option.value}
                  id={getOptionId(rootId, option.value)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled ? true : undefined}
                  onMouseEnter={() => {
                    if (!option.disabled) setActive(option.value);
                  }}
                  onClick={() => {
                    if (!option.disabled) commit(option.value);
                  }}
                  className={cn(
                    // `min-h-[44px]` + centring, matching the native leaf and
                    // Select's list exactly — see the note in select.web.tsx.
                    'flex min-h-[44px] cursor-pointer items-center px-sm py-xs',
                    option.value === active && 'bg-surface-alt',
                    isSelected && 'font-medium',
                    option.disabled && 'cursor-not-allowed text-muted',
                  )}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        )}

        {showEmpty && (
          // Not a listbox: an empty one would fail `aria-required-children`,
          // and there is nothing to navigate. A polite live region instead, so
          // a screen-reader user hears that the filter found nothing rather
          // than being left with silence.
          <div
            role="status"
            className={cn(
              'absolute z-10 mt-xs w-full rounded-md border border-line bg-card px-sm py-sm',
              'font-body text-sm text-muted shadow-lg',
            )}
          >
            {emptyMessage}
          </div>
        )}
      </div>
    );
  },
);
Combobox.displayName = 'Combobox';
