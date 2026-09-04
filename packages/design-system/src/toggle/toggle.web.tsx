// WEB LEAF — plain React DOM + Tailwind. Shares its entire pressed-state
// model with the native leaf via toggle.props; what lives here is the DOM: a
// real `<button aria-pressed>`, and — when this toggle sits inside a
// ToggleGroup — ArrowLeft/ArrowRight roving focus between sibling toggles,
// the same `data-*` + closest()/querySelectorAll() idiom accordion.web.tsx
// uses for its trigger navigation. Activation (click/Space/Enter) is left to
// the native button; only focus movement is handled here.
import * as React from 'react';

import { cn } from '../lib/cn';
import { coarseTouchTarget, disabledStyles, focusRing } from '../lib/styles';
import {
  toggleIconSizeStyles,
  toggleSizeStyles,
  useToggleState,
  type ToggleOwnProps,
} from './toggle.props';

// `value` is Omit-ed from the button props because HTMLButtonElement's own
// `value` is a form-submission string and this component's `value` means
// "this toggle's identity within an enclosing ToggleGroup" — same underlying
// type, different meaning, so the component's own must win outright (the
// AccordionRootProps `defaultValue` Omit is the same idiom).
//
// An INTERSECTION rather than an `interface … extends`, because ToggleOwnProps
// is a union (`iconOnly` and `label` are one decision — see toggle.props). That
// is the only thing the union costs. `aria-label` is Omit-ed for the reason
// IconButton omits it: `label` owns the accessible name, and leaving both open
// would let a caller name the control twice with two names free to disagree.
export type ToggleProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'value' | 'aria-label'> &
  ToggleOwnProps;

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      onClick,
      onKeyDown,
      pressed,
      defaultPressed,
      onPressedChange,
      disabled,
      value,
      size,
      iconOnly = false,
      label,
      type,
      ...props
    },
    ref,
  ) => {
    const state = useToggleState(pressed, defaultPressed, onPressedChange, disabled, value, size);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const nav = ['ArrowLeft', 'ArrowRight'];
      if (!nav.includes(event.key)) return;
      const root = event.currentTarget.closest<HTMLElement>('[data-toggle-group-root]');
      if (!root) return;
      event.preventDefault();
      const items = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-toggle-item]'));
      const i = items.indexOf(event.currentTarget);
      const target =
        event.key === 'ArrowRight'
          ? items[(i + 1) % items.length]
          : items[(i - 1 + items.length) % items.length];
      target?.focus();
    };

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        data-toggle-item=""
        aria-pressed={state.pressed}
        // Required by the type when `iconOnly`, optional otherwise, and
        // `undefined` renders no attribute at all — so a text toggle keeps its
        // name-from-content rather than gaining an empty override. `title`
        // mirrors it for the same reason IconButton mirrors its own: a pointer
        // user should read the word a screen-reader user hears.
        aria-label={label}
        title={label}
        disabled={state.disabled}
        value={value}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) state.toggle();
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center rounded-md font-body text-sm font-medium transition-colors',
          iconOnly ? toggleIconSizeStyles[state.size] : toggleSizeStyles[state.size],
          // `sm` only — `md` is already the 44dp floor. Same rule, and the same
          // shared fragment, as iconButtonClass.
          iconOnly && state.size === 'sm' && coarseTouchTarget,
          focusRing,
          disabledStyles,
          state.pressed
            ? 'bg-primary text-primary-text hover:bg-primary-hover active:bg-primary-active'
            : 'bg-transparent text-ink hover:bg-surface-alt active:bg-line',
          className,
        )}
        {...props}
      />
    );
  },
);
Toggle.displayName = 'Toggle';
