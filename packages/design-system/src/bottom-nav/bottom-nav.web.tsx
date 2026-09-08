// WEB LEAF — plain React DOM + Tailwind. Shares its entire selection model
// with the native leaf via bottom-nav.props; what lives here is the DOM: a
// named `<nav>` landmark, `aria-current="page"` on the selected item (NOT
// `role="tab"`/`aria-selected` — the WAI-ARIA APG treats a set of links to
// different views as NAVIGATION, and reserves the tabs pattern for panels
// that share one region of the SAME page; NavBar.Link makes the identical
// call for the same reason), and ArrowLeft/ArrowRight focus movement between
// items, the same `data-*` + closest()/querySelectorAll() idiom
// toggle.web.tsx uses for its own roving focus.
//
// Unlike Tabs, arrow movement here does NOT also select — these are
// natively-focusable buttons in the normal tab order (every item is reachable
// by Tab, not just the selected one), and moving focus to a destination is
// not the same act as navigating to it. Toggle makes the same choice for the
// same reason.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  BottomNavRootContext,
  useBottomNavRootContext,
  useBottomNavState,
  type BottomNavItemOwnProps,
  type BottomNavRootOwnProps,
} from './bottom-nav.props';

// `defaultValue` is Omit-ed from the nav props because React's own
// `HTMLAttributes` already declares it (a form-control value type), and this
// component's `string` meaning must win — same idiom as Tabs.Root and
// ToggleGroup.Root.
export interface BottomNavRootProps
  extends Omit<React.ComponentPropsWithoutRef<'nav'>, 'defaultValue'>, BottomNavRootOwnProps {}

const BottomNavRoot = React.forwardRef<HTMLElement, BottomNavRootProps>(
  (
    {
      className,
      style,
      value,
      defaultValue,
      onValueChange,
      showLabels = 'always',
      label = 'Primary',
      fixed = false,
      insetBottom = 0,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = useBottomNavState(value, defaultValue, onValueChange, showLabels);

    // `env(safe-area-inset-bottom)` only means anything once the bar is
    // actually pinned to the physical bottom edge — an in-flow bar (`fixed:
    // false`, a story canvas, an embedded preview) sits wherever its parent's
    // layout puts it, not necessarily near a device edge at all, so adding the
    // device inset there would pad against nothing. `insetBottom` still
    // applies either way: it is a caller-stated pixel amount, not a
    // CSS-environment lookup.
    const paddingBottom = fixed
      ? insetBottom > 0
        ? `calc(env(safe-area-inset-bottom) + ${insetBottom}px)`
        : 'env(safe-area-inset-bottom)'
      : insetBottom > 0
        ? `${insetBottom}px`
        : undefined;

    return (
      <BottomNavRootContext.Provider value={ctx}>
        <nav
          ref={ref}
          aria-label={label}
          data-bottom-nav-root=""
          className={cn(
            // `min-h-14` (56px, Material's Bottom Navigation height) rather
            // than `h-14`: a fixed height would clip under its own
            // padding-bottom once `insetBottom`/the safe-area inset is
            // non-zero, where a min-height simply grows the box to hold both.
            'flex min-h-14 w-full flex-row items-stretch border-t border-line bg-card',
            fixed && 'fixed inset-x-0 bottom-0 z-40',
            className,
          )}
          style={{ paddingBottom, ...style }}
          {...props}
        >
          {children}
        </nav>
      </BottomNavRootContext.Provider>
    );
  },
);
BottomNavRoot.displayName = 'BottomNav.Root';

// `value` is Omit-ed from the button props because React's own
// `ButtonHTMLAttributes` already declares it (a form-control value type,
// `string | ReadonlyArray<string> | number`), and this component's `string`
// identity prop must win — same idiom `BottomNavRootProps` uses for `defaultValue`.
export interface BottomNavItemProps
  extends
    Omit<React.ComponentPropsWithoutRef<'button'>, 'onClick' | 'value'>,
    BottomNavItemOwnProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

const BottomNavItem = React.forwardRef<HTMLButtonElement, BottomNavItemProps>(
  ({ className, value, label, icon, disabled = false, onClick, onKeyDown, ...props }, ref) => {
    const { value: activeValue, setValue, showLabels } = useBottomNavRootContext('Item');
    const selected = activeValue === value;
    // The label always renders — see bottom-nav.props.ts's `BottomNavItemOwnProps.label`
    // doc — so an unselected item under `showLabels: 'selected'` keeps its
    // accessible name from content; only its VISIBILITY changes, via `sr-only`.
    const labelHidden = showLabels === 'selected' && !selected;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const nav = ['ArrowLeft', 'ArrowRight'];
      if (!nav.includes(event.key)) return;
      const root = event.currentTarget.closest<HTMLElement>('[data-bottom-nav-root]');
      if (!root) return;
      event.preventDefault();
      // `:not(:disabled)` — a disabled item cannot take focus at all (a real
      // `disabled` button leaves the DOM's own focus order), so leaving one in
      // this list would move the index but land the focus nowhere.
      const items = Array.from(
        root.querySelectorAll<HTMLButtonElement>('[data-bottom-nav-item]:not(:disabled)'),
      );
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
        type="button"
        data-bottom-nav-item=""
        data-state={selected ? 'selected' : 'unselected'}
        aria-current={selected ? 'page' : undefined}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setValue(value);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-xs border-none bg-transparent px-xs font-body text-xs',
          selected ? 'text-primary' : 'text-muted',
          focusRing,
          'touch-manipulation',
          disabledStyles,
          className,
        )}
        {...props}
      >
        {/* Decorative — the button's own accessible name comes from the label
            text below (visible or `sr-only`), never from the icon. */}
        <span aria-hidden="true" className="flex h-6 items-center justify-center">
          {icon}
        </span>
        <span className={cn(labelHidden && 'sr-only')}>{label}</span>
      </button>
    );
  },
);
BottomNavItem.displayName = 'BottomNav.Item';

export const BottomNav = {
  Root: BottomNavRoot,
  Item: BottomNavItem,
};
