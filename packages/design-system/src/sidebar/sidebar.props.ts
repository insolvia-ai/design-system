// SHARED — `react` and `../lib/controllable` only.
//
// The collapse state, the ids, and the two labels the Toggle announces. What
// renders diverges completely (a `<nav>` full of `<a>`s against a View full of
// Pressables) and stays in the leaves.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export interface SidebarRootOwnProps {
  /** Controlled collapse. Pair with `onCollapsedChange`. */
  collapsed?: boolean | undefined;
  defaultCollapsed?: boolean | undefined;
  onCollapsedChange?: ((collapsed: boolean) => void) | undefined;
}

export interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  navId: string;
}

export const SidebarContext = React.createContext<SidebarContextValue | null>(null);

/**
 * The sidebar's collapse handle, for a control OUTSIDE the sidebar — a menu
 * button in a top bar, most often. Inside it, `Sidebar.Toggle` already does
 * this.
 *
 * Throws rather than returning a no-op: a toggle that silently does nothing is
 * a bug whose call site looks correct.
 */
export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar() must be called inside <Sidebar.Root>');
  return ctx;
}

export function useSidebarContext(part: string): SidebarContextValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error(`Sidebar.${part} must be rendered inside <Sidebar.Root>`);
  return ctx;
}

export function useSidebarState(
  collapsed: boolean | undefined,
  defaultCollapsed: boolean | undefined,
  onCollapsedChange: ((collapsed: boolean) => void) | undefined,
): SidebarContextValue {
  const [isCollapsed, setCollapsed] = useControllableState<boolean>(
    collapsed,
    defaultCollapsed ?? false,
    onCollapsedChange,
  );
  const id = React.useId();
  const toggle = React.useCallback(() => setCollapsed(!isCollapsed), [isCollapsed, setCollapsed]);
  return React.useMemo(
    () => ({ collapsed: isCollapsed, setCollapsed, toggle, navId: `${id}-nav` }),
    [isCollapsed, setCollapsed, toggle, id],
  );
}

/** The two widths. Collapsed keeps 64 so a 44px target still has margin. */
export const sidebarWidth = { expanded: 256, collapsed: 64 } as const;

export const DEFAULT_NAV_LABEL = 'Main';

/**
 * What the Toggle announces.
 *
 * The label describes the ACTION, not the state — "Collapse sidebar" when it
 * is open — because a button named for its current state reads as a claim
 * about the world rather than an offer. Shared so the two leaves cannot
 * announce opposite things, which is the sort of divergence only a screen
 * reader would ever surface.
 */
export function toggleLabel(collapsed: boolean): string {
  return collapsed ? 'Expand sidebar' : 'Collapse sidebar';
}

export interface SidebarItemOwnProps {
  /**
   * The item's text. Stays the accessible name when collapsed, where only the
   * icon is drawn — otherwise a collapsed sidebar is a column of unnamed
   * buttons.
   */
  label: string;
  /** Marks the current page, for both styling and assistive tech. */
  active?: boolean | undefined;
}
