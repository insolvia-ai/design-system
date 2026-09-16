// WEB LEAF — plain React DOM + Tailwind, following the APG menu-button
// pattern: a `aria-haspopup="menu"` trigger and a `role="menu"` surface whose
// items take REAL focus, one at a time, through a roving tabindex.
//
// The item order comes from the DOM rather than from a registry, which is the
// point dropdown.props.ts argues: the nodes on screen ARE the list, so the
// keyboard can never walk an order the user cannot see.
//
// SUB-MENUS are a second `role="menu"` nested inside the first, anchored to
// the `Dropdown.SubTrigger` item that opens it. Two things keep the nesting
// honest, and both are about scope: `items()` returns only the items whose
// NEAREST menu is the one being walked, so a parent never arrows into its
// child's rows; and each menu's key handler ignores keys that were pressed
// inside a nested menu, so one keystroke is answered by exactly one menu.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  DropdownContext,
  DropdownSubContext,
  useDropdownContext,
  useDropdownState,
  useDropdownSubContext,
  useDropdownSubState,
  type DropdownItemOwnProps,
  type DropdownRootOwnProps,
  type DropdownSubOwnProps,
} from './dropdown.props';

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';
const MENU_SELECTOR = '[role="menu"]';

function items(menu: HTMLElement | null): HTMLElement[] {
  if (!menu) return [];
  // Scoped to THIS menu: a sub-menu's rows are descendants of the parent's
  // node too, and without the filter End would land on the last row of
  // whichever flyout happened to be open.
  return Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (item) => item.closest(MENU_SELECTOR) === menu,
  );
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

/** True when the key was pressed on a row of `menu` itself, not of a nested menu. */
function ownsEvent(menu: HTMLElement | null, event: React.KeyboardEvent): boolean {
  return (event.target as HTMLElement | null)?.closest(MENU_SELECTOR) === menu;
}

/**
 * The vertical walk every menu shares — root and sub alike. Returns true when
 * it consumed the key, so the caller can layer its own keys (Escape, Tab,
 * ArrowLeft) on top without re-listing these.
 */
function walkMenu(menu: HTMLElement | null, event: React.KeyboardEvent): boolean {
  const all = items(menu);
  const current = all.indexOf(document.activeElement as HTMLElement);
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      focusItem(menu, current + 1);
      return true;
    case 'ArrowUp':
      event.preventDefault();
      focusItem(menu, current - 1);
      return true;
    case 'Home':
      event.preventDefault();
      focusItem(menu, 0);
      return true;
    case 'End':
      event.preventDefault();
      focusItem(menu, all.length - 1);
      return true;
  }
  return false;
}

function useMergedRef<T>(
  ref: React.ForwardedRef<T>,
): [React.MutableRefObject<T | null>, (node: T | null) => void] {
  const inner = React.useRef<T | null>(null);
  const set = React.useCallback(
    (node: T | null) => {
      inner.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  return [inner, set];
}

const menuSurface =
  'z-20 flex w-max min-w-[12rem] flex-col rounded-md border border-line bg-card py-xs font-body text-sm text-ink shadow-lg';

const itemSurface =
  'flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center px-sm py-xs text-left hover:bg-surface-alt focus:bg-surface-alt focus:outline-none';

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
        className={cn('cursor-pointer touch-manipulation', focusRing, disabledStyles, className)}
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
    const [menuRef, setRefs] = useMergedRef(ref);

    // Mounted only while open, so mount IS open: focus the first item, and
    // hand focus back to the trigger on the way out. Without the return leg a
    // keyboard user is dropped at the top of the document every time a menu
    // closes.
    React.useEffect(() => {
      if (!open) return undefined;
      focusItem(menuRef.current, 0);
      return () => document.getElementById(triggerId)?.focus();
    }, [open, triggerId, menuRef]);

    if (!open) return null;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      // A key pressed in an open sub-menu bubbles up through here. That menu
      // has already answered it; answering again would walk THIS menu's rows
      // from an index of -1.
      if (!ownsEvent(menuRef.current, event)) return;
      if (walkMenu(menuRef.current, event)) return;

      switch (event.key) {
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
        className={cn('absolute left-0 top-full mt-xs', menuSurface, className)}
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
          // The ROOT's setOpen, however deep this item sits: choosing a
          // command closes the whole tree, not just the flyout it was in.
          setOpen(false);
        }}
        className={cn(
          itemSurface,
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

// ---------------------------------------------------------------------------
// Sub-menus.

export interface DropdownSubProps extends DropdownSubOwnProps {
  children?: React.ReactNode;
}

/**
 * Wraps one `SubTrigger` and its `SubContent`. The wrapper is what the flyout
 * anchors to, and it is the hover boundary: the pointer leaving the trigger
 * AND the flyout together is what closes it, so crossing from one to the
 * other never does. `role="none"` keeps it out of the accessibility tree — a
 * `menu` may only own items, groups, separators and menus, and this is none
 * of those.
 */
const DropdownSub = ({ open, defaultOpen, onOpenChange, children }: DropdownSubProps) => {
  const ctx = useDropdownSubState(open, defaultOpen, onOpenChange);
  const { setOpen } = ctx;
  return (
    <DropdownSubContext.Provider value={ctx}>
      <div role="none" className="relative" onPointerLeave={() => setOpen(false)}>
        {children}
      </div>
    </DropdownSubContext.Provider>
  );
};

export type DropdownSubTriggerProps = React.ComponentPropsWithoutRef<'button'>;

/**
 * A menu item that opens a flyout instead of running a command. Hover opens
 * it; so do ArrowRight, Enter and Space, which also move focus into it — the
 * pointer user can see the flyout, the keyboard user has to be put there.
 */
const DropdownSubTrigger = React.forwardRef<HTMLButtonElement, DropdownSubTriggerProps>(
  ({ className, children, onClick, onKeyDown, onPointerEnter, ...props }, ref) => {
    const { open, setOpen, subMenuId, subTriggerId, focusOnOpen } =
      useDropdownSubContext('SubTrigger');

    const openAndFocus = () => {
      // The flyout mounts on the next commit; its own effect focuses the
      // first row when it does (see `SubContent`). A synchronous focus here
      // would find nothing to land on.
      focusOnOpen.current = true;
      setOpen(true);
    };

    return (
      <button
        ref={ref}
        id={subTriggerId}
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? subMenuId : undefined}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (event.defaultPrevented) return;
          focusOnOpen.current = false;
          setOpen(true);
        }}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (open) setOpen(false);
          else openAndFocus();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            openAndFocus();
          }
          // Enter and Space fall through to the button's native click.
        }}
        className={cn(itemSurface, 'justify-between gap-sm', className)}
        {...props}
      >
        {children}
        <span aria-hidden="true" className="text-muted">
          ›
        </span>
      </button>
    );
  },
);
DropdownSubTrigger.displayName = 'Dropdown.SubTrigger';

export type DropdownSubContentProps = React.ComponentPropsWithoutRef<'div'>;

const DropdownSubContent = React.forwardRef<HTMLDivElement, DropdownSubContentProps>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { setOpen: setRootOpen } = useDropdownContext('SubContent');
    const { open, setOpen, subMenuId, subTriggerId, focusOnOpen } =
      useDropdownSubContext('SubContent');
    const [menuRef, setRefs] = useMergedRef(ref);

    // Same in-and-out leg as Content, ONE difference: focus moves in only
    // when a key or a press opened the flyout. A hover-opened flyout must not
    // pull focus — the pointer is on the trigger and the arrows should keep
    // walking the parent menu — and the trigger says which it was.
    React.useEffect(() => {
      if (!open) return undefined;
      if (focusOnOpen.current) focusItem(menuRef.current, 0);
      focusOnOpen.current = false;
      return () => {
        // Return focus only if it was IN the flyout. When the whole menu
        // closes, Content's cleanup has already put focus on the root
        // trigger, and this must not steal it back to a row that is gone.
        const active = document.activeElement;
        if (active === document.body || menuRef.current?.contains(active)) {
          document.getElementById(subTriggerId)?.focus();
        }
      };
    }, [open, subTriggerId, menuRef, focusOnOpen]);

    if (!open) return null;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (!ownsEvent(menuRef.current, event)) return;
      if (walkMenu(menuRef.current, event)) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'Escape':
          // APG: Escape closes the menu that CONTAINS focus and returns focus
          // to where it was opened from — one level, not the whole tree.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          break;
        case 'Tab':
          setRootOpen(false);
          break;
      }
    };

    return (
      <div
        ref={setRefs}
        id={subMenuId}
        role="menu"
        aria-labelledby={subTriggerId}
        onKeyDown={handleKeyDown}
        // Flush against the trigger's right edge, its first row level with
        // the trigger (`-top-xs` cancels the surface's own padding). No gap on
        // purpose: a gap is a place the pointer can be that is neither on the
        // trigger nor in the flyout, and the wrapper would close it mid-crossing.
        className={cn('absolute -top-xs left-full', menuSurface, className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
DropdownSubContent.displayName = 'Dropdown.SubContent';

export const Dropdown = {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  Item: DropdownItem,
  Label: DropdownLabel,
  Divider: DropdownDivider,
  Sub: DropdownSub,
  SubTrigger: DropdownSubTrigger,
  SubContent: DropdownSubContent,
};
