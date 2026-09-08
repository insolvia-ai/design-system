// WEB LEAF — plain React DOM + Tailwind. Reference shape is Material UI's
// List/ListItem/ListItemButton/ListItemIcon/ListItemText/ListSubheader, split
// the way this package always splits a compound part: one element per part,
// no introspection of `children` to decide what anything is.
//
// `role="list"` is explicit on the `<ul>` rather than left implicit, because
// Safari drops the implicit `list`/`listitem` roles the moment `list-style` is
// `none` — which every row here needs, to lose the bullet. An explicit `role`
// survives that; VoiceOver on Safari was the browser this actually mattered
// for.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  ListRootContext,
  rowHeightStyles,
  rowPaddingStyles,
  useListRowContext,
  type ListItemOwnProps,
} from './list.props';

export interface ListRootProps extends React.ComponentPropsWithoutRef<'ul'> {
  /** Rows render at 40px instead of the default 48px. */
  dense?: boolean | undefined;
  /** Rows pad from `pl-xl` instead of `px-md`, so a Leading-less row still
   *  lines up with icon rows elsewhere in the list. */
  inset?: boolean | undefined;
}

const ListRoot = React.forwardRef<HTMLUListElement, ListRootProps>(
  ({ className, dense = false, inset = false, children, ...props }, ref) => {
    const ctx = React.useMemo(() => ({ dense, inset }), [dense, inset]);
    return (
      <ListRootContext.Provider value={ctx}>
        <ul
          ref={ref}
          role="list"
          className={cn('m-0 flex list-none flex-col p-0', className)}
          {...props}
        >
          {children}
        </ul>
      </ListRootContext.Provider>
    );
  },
);
ListRoot.displayName = 'List.Root';

export interface ListItemProps
  extends Omit<React.ComponentPropsWithoutRef<'li'>, 'onClick'>, ListItemOwnProps {
  /**
   * Wraps the row's CONTENT in a real `<button type="button">` — never
   * `<li onClick>`, which reaches no keyboard and announces nothing pressable.
   * Ignored (in favour of the anchor below) when `href` is also given.
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement> | undefined;
  /** Wraps the row's content in a real `<a>` instead of a `<button>`. */
  href?: string | undefined;
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, selected = false, disabled = false, onClick, href, children, ...rest }, ref) => {
    const { dense, inset } = useListRowContext();

    // Shared by all three renderings — only the interactive ones add hover,
    // focus and touch handling on top.
    const rowBase = cn(
      'flex w-full items-center gap-md',
      inset ? rowPaddingStyles.inset : rowPaddingStyles.normal,
      dense ? rowHeightStyles.dense : rowHeightStyles.normal,
      selected && 'bg-surface-alt',
    );

    if (href !== undefined) {
      return (
        <li ref={ref} {...rest}>
          <a
            // No `href` at all when disabled, rather than a `disabled`
            // attribute anchors do not have — `link.web.tsx` makes the same
            // call, for the same reason (an href-less `<a>` falls out of the
            // tab order on its own).
            href={disabled ? undefined : href}
            aria-disabled={disabled ? true : undefined}
            // The real ARIA signal for "this is the page you're on" — only
            // meaningful on the anchor case, which is the only row that
            // stands for a destination at all.
            aria-current={selected ? 'page' : undefined}
            data-state={selected ? 'selected' : undefined}
            onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
            className={cn(
              rowBase,
              'touch-manipulation rounded-sm text-left no-underline',
              focusRing,
              disabled
                ? 'pointer-events-none cursor-not-allowed opacity-50'
                : 'hover:bg-surface-alt',
              className,
            )}
          >
            {children}
          </a>
        </li>
      );
    }

    if (onClick !== undefined) {
      return (
        <li ref={ref} {...rest}>
          <button
            type="button"
            disabled={disabled}
            data-state={selected ? 'selected' : undefined}
            onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
            className={cn(
              rowBase,
              'touch-manipulation rounded-sm text-left hover:bg-surface-alt',
              focusRing,
              disabledStyles,
              className,
            )}
          >
            {children}
          </button>
        </li>
      );
    }

    // Plain `<li>` — no button, no anchor, nothing for a keyboard to land on,
    // because there is nothing here for it to do.
    return (
      <li
        ref={ref}
        data-state={selected ? 'selected' : undefined}
        className={cn(rowBase, disabled && 'opacity-50', className)}
        {...rest}
      >
        {children}
      </li>
    );
  },
);
ListItem.displayName = 'List.Item';

const ListLeading = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      // Decorative by default — the row's own `List.Text` carries the
      // meaning. A Leading that IS the meaning (no accompanying label) is a
      // misuse this leaf cannot see; say so in the consumer's own markup
      // instead of overriding this.
      aria-hidden="true"
      className={cn('flex size-6 shrink-0 items-center justify-center text-muted', className)}
      {...props}
    />
  ),
);
ListLeading.displayName = 'List.Leading';

const ListTrailing = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    // NOT decorative by default, unlike Leading: a Switch or a Badge living
    // here is real content, not a doodle beside the label.
    <span ref={ref} className={cn('ml-auto flex shrink-0 items-center', className)} {...props} />
  ),
);
ListTrailing.displayName = 'List.Trailing';

export interface ListTextProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The row's main label. */
  primary: React.ReactNode;
  /** A second, quieter line under `primary`. Omit for a single-line row. */
  secondary?: React.ReactNode | undefined;
}

// Named `ListTextPart` internally only — this is `List.Text`, a different
// thing from the package's own `Text` component (`src/text/`), which this
// leaf never imports.
const ListTextPart = React.forwardRef<HTMLDivElement, ListTextProps>(
  ({ className, primary, secondary, ...props }, ref) => (
    <div ref={ref} className={cn('min-w-0 flex-1', className)} {...props}>
      <div className="truncate font-body text-sm text-ink">{primary}</div>
      {secondary !== undefined ? (
        <div className="truncate font-body text-xs text-muted">{secondary}</div>
      ) : null}
    </div>
  ),
);
ListTextPart.displayName = 'List.Text';

// A plain `<li>` with the heading text — not `role="presentation"`. That was
// the first draft, borrowed from `Dropdown.Label`, but `Dropdown`'s reason for
// it does not hold here: `role="menu"` requires every child to be a menu item
// (or a group/separator), so a labelled node with no such role fails
// `aria-required-children`. `role="list"` carries no such restriction — an
// `<li>`'s implicit `listitem` role satisfies it on its own — so the heading
// can simply BE a list item, read aloud like any other row instead of erased
// from the tree.
const ListSubheader = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn(
        'px-md py-sm font-body text-xs font-medium uppercase tracking-wide text-muted',
        className,
      )}
      {...props}
    />
  ),
);
ListSubheader.displayName = 'List.Subheader';

export interface ListDividerProps extends React.ComponentPropsWithoutRef<'li'> {
  /** Starts the rule under the text column instead of the left edge, so it
   *  reads as separating ROWS rather than crossing the icon column too. */
  inset?: boolean | undefined;
}

const ListDivider = React.forwardRef<HTMLLIElement, ListDividerProps>(
  ({ className, inset = false, ...props }, ref) => (
    // A presentational `<li>` — `role="presentation"` plus `aria-hidden`
    // removes it from the accessibility tree entirely, rather than trying to
    // satisfy `role="list"`'s required-children check with an illegal
    // `role="separator"` `<li>` (axe's `aria-required-children`: a `list`
    // role may only contain `listitem` children, and `separator` is not
    // one). The hairline itself moves to a plain `<hr>` inside it, which
    // carries no ARIA baggage of its own.
    <li ref={ref} role="presentation" aria-hidden="true" {...props}>
      <hr className={cn('m-0 my-xs h-px border-0 bg-line', inset && 'ml-14', className)} />
    </li>
  ),
);
ListDivider.displayName = 'List.Divider';

export const List = {
  Root: ListRoot,
  Item: ListItem,
  Leading: ListLeading,
  Trailing: ListTrailing,
  Text: ListTextPart,
  Subheader: ListSubheader,
  Divider: ListDivider,
};
