// SHARED — `react` and `../lib/controllable` only.
//
// WHAT IS AND IS NOT SHARED HERE, because a menu splits unusually.
//
// Shared: the open/closed state, the trigger/menu id pair, and the selection
// contract — activating an item closes the menu unless the handler says
// otherwise.
//
// NOT shared: the keyboard grammar, which is the one thing you might expect to
// find beside `selectKeyIntent`. A listbox keeps focus on its trigger and
// moves a virtual highlight (`aria-activedescendant`), which is why Select can
// express its whole grammar as a pure function over an option ARRAY. The APG
// menu pattern moves REAL focus between the items instead — so on web the DOM
// already holds the item order, and a second copy of it in a registry would be
// a chance to disagree with what is on screen. The web leaf walks its own
// `[role="menuitem"]` nodes; the native leaf has no focus to move and drives
// the menu by press, which is what a touch screen offers anyway.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export interface DropdownRootOwnProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
  triggerId: string;
}

export const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export function useDropdownContext(part: string): DropdownContextValue {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error(`Dropdown.${part} must be rendered inside <Dropdown.Root>`);
  return ctx;
}

export function useDropdownState(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
): DropdownContextValue {
  const [isOpen, setOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const id = React.useId();
  return React.useMemo(
    () => ({ open: isOpen, setOpen, menuId: `${id}-menu`, triggerId: `${id}-trigger` }),
    [isOpen, setOpen, id],
  );
}

export interface DropdownItemOwnProps {
  disabled?: boolean | undefined;
  /**
   * Called when the item is chosen. The menu closes afterwards — a menu that
   * stayed open after a command would leave the user pressing Escape to
   * confirm something already happened.
   */
  onSelect?: (() => void) | undefined;
}

// ---------------------------------------------------------------------------
// Sub-menus.
//
// A `Dropdown.Sub` nests inside a `Dropdown.Content` (or another Sub) and owns
// ONE open/closed bit for its own flyout. It sits UNDER the root context
// rather than replacing it: an item chosen three levels deep still closes the
// whole menu through the root's `setOpen`, which is the selection contract
// above and the reason `DropdownItem` never needs to know how deep it is.
//
// Here as on the root, the keyboard grammar stays in the web leaf. What the
// two leaves share is the state, the id pair, and the roles: the sub trigger
// is a `menuitem` that also has `aria-haspopup="menu"` and `aria-expanded`,
// and the sub content is a second `menu` labelled by that trigger.

export interface DropdownSubOwnProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface DropdownSubContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  subMenuId: string;
  subTriggerId: string;
  /**
   * Set by the trigger just before it opens the flyout, read once by the
   * flyout when it mounts: a keyboard or press open moves focus into the
   * flyout, a hover open does not. A ref rather than state because it is a
   * one-shot message between two commits, not something to render from.
   */
  focusOnOpen: React.MutableRefObject<boolean>;
}

export const DropdownSubContext = React.createContext<DropdownSubContextValue | null>(null);

export function useDropdownSubContext(part: string): DropdownSubContextValue {
  const ctx = React.useContext(DropdownSubContext);
  if (!ctx) throw new Error(`Dropdown.${part} must be rendered inside <Dropdown.Sub>`);
  return ctx;
}

export function useDropdownSubState(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
): DropdownSubContextValue {
  const [isOpen, setOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const id = React.useId();
  const focusOnOpen = React.useRef(false);
  return React.useMemo(
    () => ({
      open: isOpen,
      setOpen,
      subMenuId: `${id}-submenu`,
      subTriggerId: `${id}-subtrigger`,
      focusOnOpen,
    }),
    [isOpen, setOpen, id],
  );
}
