// WEB LEAF — plain React DOM + Tailwind, following the APG menu-button
// pattern: a `aria-haspopup="menu"` trigger and a `role="menu"` surface whose
// items take REAL focus, one at a time, through a roving tabindex.
//
// The item order comes from the DOM rather than from a registry, which is the
// point dropdown.props.ts argues: the nodes on screen ARE the list, so the
// keyboard can never walk an order the user cannot see.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  DropdownContext,
  useDropdownContext,
  useDropdownState,
  type DropdownItemOwnProps,
  type DropdownRootOwnProps,
} from './dropdown.props';

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

function items(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

function focusItem(menu: HTMLElement | null, index: number): void {
  const all = items(menu);
  if (all.length === 0) return;
  // Clamped, not wrapped — the same choice `stepEnabled` makes for Select, and
  // for the same reason: holding an arrow key settles at an end instead of
  // cycling forever. Home/End are the way to jump.
  const clamped = Math.max(0, Math.min(index, all.length - 1));
  all[clamped]?.focus();
}

export interface DropdownRootProps extends DropdownRootOwnProps {
  children?: React.ReactNode;
}

const DropdownRoot = ({ open, defaultOpen, onOpenChange, children }: DropdownRootProps) => {
  const ctx = useDropdownState(open, defaultOpen, onOpenChange);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { open: isOpen, setOpen } = ctx;

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node | null)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen, setOpen]);

  return (
    <DropdownContext.Provider value={ctx}>
      <div ref={rootRef} className="relative inline-flex">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export type DropdownTriggerProps = React.ComponentPropsWithoutRef<'button'>;

const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, onClick, onKeyDown, ...props }, ref) => {
    const { open, setOpen, menuId, triggerId } = useDropdownContext('Trigger');
    return (
      <button
        ref={ref}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(!open);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // ArrowDown/ArrowUp open the menu AND move into it, which is what
          // the APG pattern specifies — opening without entering leaves a
          // keyboard user with a menu they have to find a second time.
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn('cursor-pointer', focusRing, disabledStyles, className)}
        {...props}
      />
    );
  },
);
DropdownTrigger.displayName = 'Dropdown.Trigger';

export type DropdownContentProps = React.ComponentPropsWithoutRef<'div'>;

const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { open, setOpen, menuId, triggerId } = useDropdownContext('Content');
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        menuRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // Mounted only while open, so mount IS open: focus the first item, and
    // hand focus back to the trigger on the way out. Without the return leg a
    // keyboard user is dropped at the top of the document every time a menu
    // closes.
    React.useEffect(() => {
      if (!open) return undefined;
      focusItem(menuRef.current, 0);
      return () => document.getElementById(triggerId)?.focus();
    }, [open, triggerId]);

    if (!open) return null;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const all = items(menuRef.current);
      const current = all.indexOf(document.activeElement as HTMLElement);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusItem(menuRef.current, current + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusItem(menuRef.current, current - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusItem(menuRef.current, 0);
          break;
        case 'End':
          event.preventDefault();
          focusItem(menuRef.current, all.length - 1);
          break;
        case 'Escape':
          event.preventDefault();
          setOpen(false);
          break;
        case 'Tab':
          // Tab leaves the menu entirely. NOT prevented — focus has to keep
          // going — but the menu closes behind it.
          setOpen(false);
          break;
      }
    };

    return (
      <div
        ref={setRefs}
        id={menuId}
        role="menu"
        aria-labelledby={triggerId}
        onKeyDown={handleKeyDown}
        className={cn(
          'absolute left-0 top-full z-20 mt-xs flex w-max min-w-[12rem] flex-col',
          'rounded-md border border-line bg-card py-xs font-body text-sm text-ink shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
DropdownContent.displayName = 'Dropdown.Content';

export interface DropdownItemProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onSelect'>, DropdownItemOwnProps {}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, disabled = false, onSelect, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownContext('Item');
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        // Roving tabindex: the menu is one tab stop, and the arrows move
        // within it. Every item is reachable by focus() and none by Tab.
        tabIndex={-1}
        // `aria-disabled` rather than the `disabled` attribute: a disabled
        // button is removed from the focus order entirely, and APG wants a
        // disabled menu item to stay arrow-reachable so its presence is
        // discoverable. The click guard below is what makes it inert.
        aria-disabled={disabled ? true : undefined}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
          if (event.defaultPrevented) return;
          onSelect?.();
          setOpen(false);
        }}
        className={cn(
          'flex min-h-[44px] w-full cursor-pointer items-center px-sm py-xs text-left',
          'hover:bg-surface-alt focus:bg-surface-alt focus:outline-none',
          disabled && 'cursor-not-allowed text-muted hover:bg-transparent',
          className,
        )}
        {...props}
      />
    );
  },
);
DropdownItem.displayName = 'Dropdown.Item';

/**
 * A section heading inside the menu.
 *
 * `role="presentation"` removes it from the accessibility tree: `role="menu"`
 * requires its children to be menu items, groups or separators, and a stray
 * labelled node would be an `aria-required-children` failure. Sighted users get
 * the grouping; screen-reader users get an unbroken run of items, which is the
 * lesser of the two compromises available here.
 */
const DropdownLabel = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="presentation"
      className={cn('px-sm py-xs font-body text-xs font-semibold text-muted', className)}
      {...props}
    />
  ),
);
DropdownLabel.displayName = 'Dropdown.Label';

const DropdownDivider = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="separator" className={cn('my-xs h-px bg-line', className)} {...props} />
  ),
);
DropdownDivider.displayName = 'Dropdown.Divider';

export const Dropdown = {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  Item: DropdownItem,
  Label: DropdownLabel,
  Divider: DropdownDivider,
};
