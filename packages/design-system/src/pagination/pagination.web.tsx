// WEB LEAF — plain React DOM + Tailwind. `<nav>` landmark wrapping a `<ul>`
// of buttons.
//
// WHY THIS SHAPE, AND WHY NO ROVING TABINDEX. The WAI-ARIA authoring
// practices have no dedicated pagination pattern — its closest relative, the
// listbox, models a value the user CHOOSES, not a page the user NAVIGATES
// to — so this follows the same "labelled nav landmark around a list of
// controls" shape Breadcrumbs and Sidebar already use here. Every item is a
// real `<button>`: natively focusable and already in Tab order, which is the
// entire keyboard story. A roving-tabindex grammar exists to make a composite
// widget's items reachable with ONE Tab stop plus arrow keys (a toolbar, a
// tablist); nothing here asks a pagination control to behave like one, and no
// documented pattern says it should.
import * as React from 'react';

import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  FIRST_LABEL,
  LAST_LABEL,
  NEXT_LABEL,
  PREV_LABEL,
  pageLabel,
  sizeItemClass,
  usePaginationState,
  type PaginationOwnProps,
} from './pagination.props';

export interface PaginationProps
  extends
    PaginationOwnProps,
    Omit<React.ComponentPropsWithoutRef<'nav'>, keyof PaginationOwnProps> {}

const itemBase = 'inline-flex items-center justify-center rounded-md font-body touch-manipulation';

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      count,
      page,
      defaultPage,
      onPageChange,
      siblingCount = 1,
      boundaryCount = 1,
      showFirstLast = false,
      size = 'md',
      disabled = false,
      label = 'Pagination',
      ...props
    },
    ref,
  ) => {
    const state = usePaginationState({
      count,
      page,
      defaultPage,
      onPageChange,
      siblingCount,
      boundaryCount,
    });

    // Out-of-range is the only guard needed: Previous/Next/First/Last are the
    // sole callers that can ask for one, since every page button's own value
    // is already inside [1, count] by construction of `paginationItems`.
    const go = (next: number) => {
      if (next < 1 || next > count) return;
      state.setPage(next);
    };

    const chromeClass = cn(
      itemBase,
      sizeItemClass[size],
      focusRing,
      'text-ink hover:bg-surface-alt',
    );

    return (
      <nav ref={ref} aria-label={label} className={cn('inline-flex', className)} {...props}>
        <ul className="flex flex-wrap items-center gap-1">
          {showFirstLast ? (
            <li>
              <button
                type="button"
                aria-label={FIRST_LABEL}
                disabled={disabled || state.page <= 1}
                onClick={() => go(1)}
                className={chromeClass}
              >
                «
              </button>
            </li>
          ) : null}
          <li>
            <button
              type="button"
              aria-label={PREV_LABEL}
              disabled={disabled || state.page <= 1}
              onClick={() => go(state.page - 1)}
              className={chromeClass}
            >
              ‹
            </button>
          </li>
          {state.items.map((item) =>
            item.type === 'ellipsis' ? (
              // Decorative — the list's order already conveys the sequence,
              // exactly as Breadcrumbs' separator does.
              <li
                key={item.key}
                aria-hidden="true"
                className={cn(
                  'inline-flex select-none items-center justify-center text-muted',
                  sizeItemClass[size],
                )}
              >
                …
              </li>
            ) : (
              <li key={item.page}>
                <button
                  type="button"
                  aria-current={item.page === state.page ? 'page' : undefined}
                  aria-label={pageLabel(item.page, item.page === state.page)}
                  data-state={item.page === state.page ? 'active' : undefined}
                  disabled={disabled}
                  onClick={() => go(item.page)}
                  className={cn(
                    itemBase,
                    sizeItemClass[size],
                    focusRing,
                    'tabular-nums',
                    item.page === state.page
                      ? 'bg-primary text-primary-text'
                      : 'text-ink hover:bg-surface-alt',
                  )}
                >
                  {item.page}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              aria-label={NEXT_LABEL}
              disabled={disabled || state.page >= count}
              onClick={() => go(state.page + 1)}
              className={chromeClass}
            >
              ›
            </button>
          </li>
          {showFirstLast ? (
            <li>
              <button
                type="button"
                aria-label={LAST_LABEL}
                disabled={disabled || state.page >= count}
                onClick={() => go(count)}
                className={chromeClass}
              >
                »
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';
