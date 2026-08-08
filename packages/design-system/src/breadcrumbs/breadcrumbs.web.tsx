// WEB LEAF — plain React DOM + Tailwind. `<nav>` landmark wrapping an ordered
// list, which is the WAI-ARIA authoring-practices shape for a breadcrumb: the
// list is what conveys "these are steps in a sequence" to assistive tech, and
// the separators are hidden from it.
import * as React from 'react';

import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  DEFAULT_BREADCRUMBS_LABEL,
  DEFAULT_SEPARATOR,
  type BreadcrumbsItemOwnProps,
} from './breadcrumbs.props';

export interface BreadcrumbsRootProps extends React.ComponentPropsWithoutRef<'nav'> {
  /** Names the landmark. See `DEFAULT_BREADCRUMBS_LABEL`. */
  label?: string | undefined;
  /** What sits between crumbs. See `DEFAULT_SEPARATOR`. */
  separator?: React.ReactNode;
}

const BreadcrumbsRoot = React.forwardRef<HTMLElement, BreadcrumbsRootProps>(
  (
    {
      className,
      label = DEFAULT_BREADCRUMBS_LABEL,
      separator = DEFAULT_SEPARATOR,
      children,
      ...props
    },
    ref,
  ) => {
    // Separators are injected BY THE ROOT rather than asked of the caller:
    // a trailing separator after the last crumb is the classic hand-rolled
    // breadcrumb bug, and interleaving here makes it unreachable.
    const items = React.Children.toArray(children).filter(React.isValidElement);

    return (
      <nav ref={ref} aria-label={label} className={cn('w-full', className)} {...props}>
        <ol className="flex flex-wrap items-center gap-xs font-body text-sm">
          {items.map((item, index) => (
            <React.Fragment key={item.key ?? index}>
              {index > 0 ? (
                <li aria-hidden="true" className="select-none text-muted">
                  {separator}
                </li>
              ) : null}
              {item}
            </React.Fragment>
          ))}
        </ol>
      </nav>
    );
  },
);
BreadcrumbsRoot.displayName = 'Breadcrumbs.Root';

export interface BreadcrumbsItemProps
  extends Omit<React.ComponentPropsWithoutRef<'a'>, 'aria-current'>, BreadcrumbsItemOwnProps {}

// Renders its own `<li>`, so the Root's `<ol>` never contains a stray
// non-list-item child — `aria-required-children` would flag it, and the
// alternative (Root wrapping each child) breaks the moment a caller composes
// their own router link in here.
const BreadcrumbsItem = React.forwardRef<HTMLAnchorElement, BreadcrumbsItemProps>(
  ({ className, current = false, href, children, ...props }, ref) => (
    <li className="flex items-center">
      {current || href === undefined ? (
        // The current page is NOT a link — a link to where you already are is
        // a documented WCAG annoyance, and `aria-current` is what conveys the
        // position instead.
        <span
          aria-current={current ? 'page' : undefined}
          className={cn('font-medium text-ink', className)}
        >
          {children}
        </span>
      ) : (
        <a
          ref={ref}
          href={href}
          className={cn(
            'rounded-sm text-muted underline-offset-2 hover:underline',
            focusRing,
            className,
          )}
          {...props}
        >
          {children}
        </a>
      )}
    </li>
  ),
);
BreadcrumbsItem.displayName = 'Breadcrumbs.Item';

export const Breadcrumbs = {
  Root: BreadcrumbsRoot,
  Item: BreadcrumbsItem,
};
