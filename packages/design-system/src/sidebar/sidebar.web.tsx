// WEB LEAF — plain React DOM + Tailwind.
//
// ONE landmark, on `Sidebar.Nav`. The Root is a plain container on purpose: a
// `<nav>` inside an `<aside>` gives a page two overlapping landmarks covering
// the same content, which is what `landmark-unique` exists to complain about
// and what a screen-reader user experiences as the same links listed twice.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  DEFAULT_NAV_LABEL,
  SidebarContext,
  sidebarWidth,
  toggleLabel,
  useSidebarContext,
  useSidebarState,
  type SidebarItemOwnProps,
  type SidebarRootOwnProps,
} from './sidebar.props';

export interface SidebarRootProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'>, SidebarRootOwnProps {}

const SidebarRoot = React.forwardRef<HTMLDivElement, SidebarRootProps>(
  ({ className, collapsed, defaultCollapsed, onCollapsedChange, children, ...props }, ref) => {
    const ctx = useSidebarState(collapsed, defaultCollapsed, onCollapsedChange);
    return (
      <SidebarContext.Provider value={ctx}>
        <div
          ref={ref}
          data-collapsed={ctx.collapsed ? '' : undefined}
          style={{ width: ctx.collapsed ? sidebarWidth.collapsed : sidebarWidth.expanded }}
          className={cn(
            'flex h-full flex-col gap-sm border-r border-line bg-card py-md transition-[width]',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  },
);
SidebarRoot.displayName = 'Sidebar.Root';

const SidebarHead = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-sm px-md', className)} {...props} />
  ),
);
SidebarHead.displayName = 'Sidebar.Head';

/** The mark. Decorative by default — the Title is what names the product. */
const SidebarLogo = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('flex size-8 shrink-0 items-center justify-center text-brand', className)}
      {...props}
    />
  ),
);
SidebarLogo.displayName = 'Sidebar.Logo';

const SidebarTitle = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, children, ...props }, ref) => {
    const { collapsed } = useSidebarContext('Title');
    // Removed from the DOM rather than hidden with CSS when collapsed: a
    // visually-hidden title still lands in the accessible name of anything
    // that wraps it, and a 64px rail has nothing to show it in anyway.
    if (collapsed) return null;
    return (
      <span
        ref={ref}
        className={cn('truncate font-heading text-base font-semibold text-ink', className)}
        {...props}
      >
        {children}
      </span>
    );
  },
);
SidebarTitle.displayName = 'Sidebar.Title';

const SidebarToggle = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { collapsed, toggle, navId } = useSidebarContext('Toggle');
    return (
      <button
        ref={ref}
        type="button"
        // Names the ACTION, not the state — see `toggleLabel`.
        aria-label={toggleLabel(collapsed)}
        aria-expanded={!collapsed}
        aria-controls={navId}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) toggle();
        }}
        className={cn(
          'ml-auto flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-surface-alt',
          focusRing,
          disabledStyles,
          className,
        )}
        {...props}
      >
        <span aria-hidden="true">{children ?? (collapsed ? '»' : '«')}</span>
      </button>
    );
  },
);
SidebarToggle.displayName = 'Sidebar.Toggle';

export interface SidebarNavProps extends React.ComponentPropsWithoutRef<'nav'> {
  /** Names the landmark. */
  label?: string | undefined;
}

const SidebarNav = React.forwardRef<HTMLElement, SidebarNavProps>(
  ({ className, label = DEFAULT_NAV_LABEL, children, ...props }, ref) => {
    const { navId } = useSidebarContext('Nav');
    return (
      <nav
        ref={ref}
        id={navId}
        aria-label={label}
        className={cn('flex flex-1 flex-col gap-xs overflow-y-auto', className)}
        {...props}
      >
        {children}
      </nav>
    );
  },
);
SidebarNav.displayName = 'Sidebar.Nav';

export interface SidebarSectionProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Heading for the group; also the group's accessible name. */
  title?: string | undefined;
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, title, children, ...props }, ref) => {
    const { collapsed } = useSidebarContext('Section');
    return (
      <div
        ref={ref}
        // A `group` role, not a second landmark: the Nav above is the landmark,
        // and this is a labelled slice of it. When collapsed there is no
        // visible title, so the group takes it as an aria-label instead of
        // pointing at an element that is not rendered.
        role="group"
        aria-label={title}
        className={cn('flex flex-col gap-px py-xs', className)}
        {...props}
      >
        {title !== undefined && !collapsed ? (
          <span className="px-md py-xs font-body text-xs font-semibold uppercase tracking-wide text-muted">
            {title}
          </span>
        ) : null}
        {children}
      </div>
    );
  },
);
SidebarSection.displayName = 'Sidebar.Section';

export interface SidebarItemProps
  extends Omit<React.ComponentPropsWithoutRef<'a'>, 'aria-current'>, SidebarItemOwnProps {
  /** Icon slot, and the only thing shown while collapsed. */
  icon?: React.ReactNode;
}

const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ className, label, active = false, icon, href, ...props }, ref) => {
    const { collapsed } = useSidebarContext('Item');
    return (
      <a
        ref={ref}
        href={href}
        aria-current={active ? 'page' : undefined}
        // The label survives the collapse as the accessible name; without it a
        // collapsed sidebar is a column of unnamed links.
        aria-label={collapsed ? label : undefined}
        className={cn(
          // 44px, the WCAG 2.5.5 target-size floor every press target in this
          // package holds.
          'mx-sm flex min-h-[44px] items-center gap-sm rounded-md px-sm font-body text-sm no-underline',
          collapsed && 'justify-center',
          active ? 'bg-surface-alt font-medium text-ink' : 'text-muted hover:bg-surface-alt',
          focusRing,
          className,
        )}
        {...props}
      >
        {icon === undefined ? null : (
          <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
            {icon}
          </span>
        )}
        {collapsed ? null : <span className="truncate">{label}</span>}
      </a>
    );
  },
);
SidebarItem.displayName = 'Sidebar.Item';

const SidebarSeparator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn('mx-md my-xs h-px bg-line', className)}
      {...props}
    />
  ),
);
SidebarSeparator.displayName = 'Sidebar.Separator';

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-auto flex flex-col gap-xs px-md pt-sm', className)}
      {...props}
    />
  ),
);
SidebarFooter.displayName = 'Sidebar.Footer';

export const Sidebar = {
  Root: SidebarRoot,
  Head: SidebarHead,
  Logo: SidebarLogo,
  Title: SidebarTitle,
  Toggle: SidebarToggle,
  Nav: SidebarNav,
  Section: SidebarSection,
  Item: SidebarItem,
  Separator: SidebarSeparator,
  Footer: SidebarFooter,
};
