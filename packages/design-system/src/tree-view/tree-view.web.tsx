// WEB LEAF — plain React DOM + Tailwind, WAI-ARIA "TreeView" pattern (APG).
// Shares its entire state model with the native leaf via tree-view.props; what
// lives here is the DOM: tree/treeitem/group roles, aria-expanded/-selected/
// -level, roving tabindex, and the ArrowUp/Down/Left/Right + Home/End/Enter/
// Space keyboard grammar the APG pattern calls for. A single click on a row
// both selects the item and (for a branch) toggles it — there is no separate
// touch target on THIS leaf the way the native leaf needs one, because a mouse
// click is already precise enough to land on either the chevron or the label.
import * as React from 'react';

import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  TreeViewItemContext,
  TreeViewRootContext,
  isTreeItemTabbable,
  useTreeViewItemState,
  useTreeViewRootContext,
  useTreeViewState,
  visibleOrder,
  type TreeViewItemOwnProps,
  type TreeViewRootOwnProps,
} from './tree-view.props';

export interface TreeViewRootProps
  extends Omit<React.ComponentPropsWithoutRef<'ul'>, 'children'>, TreeViewRootOwnProps {
  children?: React.ReactNode;
}

const TreeViewRoot = React.forwardRef<HTMLUListElement, TreeViewRootProps>(
  (
    {
      className,
      expanded,
      defaultExpanded,
      onExpandedChange,
      selected,
      defaultSelected,
      onSelectedChange,
      label = 'Tree',
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = useTreeViewState(
      expanded,
      defaultExpanded,
      onExpandedChange,
      selected,
      defaultSelected,
      onSelectedChange,
      disabled,
    );
    return (
      <TreeViewRootContext.Provider value={ctx}>
        <ul
          ref={ref}
          role="tree"
          aria-label={label}
          data-tree-root=""
          className={cn('m-0 flex list-none flex-col gap-px p-0', className)}
          {...props}
        >
          {children}
        </ul>
      </TreeViewRootContext.Provider>
    );
  },
);
TreeViewRoot.displayName = 'TreeView.Root';

// `value` is Omit-ed because `LiHTMLAttributes` already declares it (the
// `<li value="n">` ordinal override inside an `<ol>`), and the item's
// identity-string meaning must win — same reasoning radio-group.web.tsx's
// `RadioGroupItemProps` gives for omitting it from `ButtonHTMLAttributes`.
export interface TreeViewItemProps
  extends Omit<React.ComponentPropsWithoutRef<'li'>, 'children' | 'value'>, TreeViewItemOwnProps {}

const TreeViewItem = React.forwardRef<HTMLLIElement, TreeViewItemProps>(
  (
    {
      className,
      value,
      label,
      disabled: itemDisabled = false,
      icon,
      children,
      onKeyDown,
      onFocus,
      ...props
    },
    forwardedRef,
  ) => {
    const root = useTreeViewRootContext('Item');
    const itemCtx = useTreeViewItemState(value);
    const disabled = root.disabled || itemDisabled;
    // An Item WITH children is a branch — see tree-view.props.ts's own doc on
    // `TreeViewItemOwnProps.children`. There is no separate `variant` prop for
    // this because it is never something a caller has to get independently
    // right of the tree shape they already wrote.
    const isBranch = children !== undefined && children !== null;
    const open = isBranch && root.isExpanded(value);
    const selected = root.selected === value;

    const innerRef = React.useRef<HTMLLIElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLLIElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    // Whether this is the very first item rendered in the WHOLE tree — a DOM
    // fact, read once on mount with the same closest()/querySelector() idiom
    // radio-group.web.tsx uses for its own "first item" fallback. Only matters
    // before anything has been focused or selected — see `isTreeItemTabbable`.
    const [isFirst, setIsFirst] = React.useState(false);
    React.useEffect(() => {
      const rootEl = innerRef.current?.closest<HTMLElement>('[data-tree-root]');
      const first = rootEl?.querySelector<HTMLLIElement>('[data-tree-item]');
      setIsFirst(first === innerRef.current);
    }, []);

    const tabbable = isTreeItemTabbable(value, root.activeValue, root.selected, isFirst);

    const selectAndToggle = () => {
      if (disabled) return;
      root.setActiveValue(value);
      root.select(value);
      if (isBranch) root.setExpanded(value, !open);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      // A keydown fired on a NESTED item's <li> bubbles through this one too —
      // the nested `group` sits INSIDE this `li`, so without this guard a
      // single key press would run twice, once per ancestor on the path to
      // the root. Only react when this li is itself the event's origin.
      if (event.target !== event.currentTarget) return;
      if (disabled) return;

      const rootEl = innerRef.current?.closest<HTMLElement>('[data-tree-root]');
      if (!rootEl) return;

      const order = visibleOrder(root.registry.entries(), root.expanded);
      const items = Array.from(rootEl.querySelectorAll<HTMLLIElement>('[data-tree-item]'));
      const focusValue = (target: string | undefined) => {
        if (target === undefined) return;
        root.setActiveValue(target);
        items.find((el) => el.dataset.treeValue === target)?.focus();
      };

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          focusValue(order[order.indexOf(value) + 1]);
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          focusValue(order[order.indexOf(value) - 1]);
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          if (!isBranch) break;
          // Closed: expand in place, focus stays put. Already open: move INTO
          // the first child, which sits immediately after this item in
          // visible order once it is mounted.
          if (!open) root.setExpanded(value, true);
          else focusValue(order[order.indexOf(value) + 1]);
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          if (isBranch && open) root.setExpanded(value, false);
          else if (itemCtx.parentValue !== null) focusValue(itemCtx.parentValue);
          break;
        }
        case 'Home': {
          event.preventDefault();
          focusValue(order[0]);
          break;
        }
        case 'End': {
          event.preventDefault();
          focusValue(order[order.length - 1]);
          break;
        }
        case 'Enter': {
          event.preventDefault();
          root.select(value);
          break;
        }
        case ' ': {
          event.preventDefault();
          if (isBranch) root.setExpanded(value, !open);
          break;
        }
        default:
          break;
      }
    };

    return (
      <TreeViewItemContext.Provider value={itemCtx}>
        <li
          ref={setRefs}
          role="treeitem"
          data-tree-item=""
          data-tree-value={value}
          // A branch's ACCESSIBLE NAME would otherwise be computed from ALL
          // of its content — including its own nested `role="group"`, which
          // sits INSIDE this `li` per the APG pattern. An open branch's name
          // would run on to include every descendant's label ("src components
          // button.tsx docs …"), because AccName has no rule that stops at a
          // nested treeitem the way it does at a genuinely presentational
          // one. An explicit `aria-label` short-circuits content-based
          // computation entirely, so the name stays this item's own label —
          // the same fix the native leaf reaches for with its own
          // `accessibilityLabel`, and for the identical reason.
          aria-label={typeof label === 'string' ? label : undefined}
          aria-level={itemCtx.depth + 1}
          aria-selected={selected}
          aria-disabled={disabled ? true : undefined}
          aria-expanded={isBranch ? open : undefined}
          data-state={isBranch ? (open ? 'open' : 'closed') : undefined}
          data-selected={selected ? '' : undefined}
          data-disabled={disabled ? '' : undefined}
          tabIndex={disabled ? -1 : tabbable ? 0 : -1}
          onKeyDown={handleKeyDown}
          onFocus={(event) => {
            onFocus?.(event);
            if (!disabled) root.setActiveValue(value);
          }}
          className={cn('list-none rounded-sm', focusRing, className)}
          {...props}
        >
          <div
            onClick={selectAndToggle}
            style={{ paddingLeft: itemCtx.depth * 16 + 8 }}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-sm rounded-sm pr-sm',
              selected && 'bg-surface-alt',
              disabled
                ? 'pointer-events-none cursor-not-allowed opacity-50'
                : 'hover:bg-surface-alt',
              'touch-manipulation',
            )}
          >
            {isBranch ? (
              // Decorative — the li's own aria-expanded is the real signal;
              // this is only the visual echo of it. Rotated rather than
              // swapped for a different glyph, so its identity as "the same
              // control, two states" survives for a sighted reader too.
              <span
                aria-hidden="true"
                data-state={open ? 'open' : 'closed'}
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center text-muted transition-transform duration-150 motion-reduce:transition-none',
                  open && 'rotate-90',
                )}
              >
                {'▸'}
              </span>
            ) : (
              // An empty slot the same width as a chevron, so a leaf's label
              // lines up with a branch sibling's instead of sitting one glyph
              // further left.
              <span aria-hidden="true" className="size-4 shrink-0" />
            )}
            {icon !== undefined ? (
              <span
                aria-hidden="true"
                className="flex size-4 shrink-0 items-center justify-center text-muted"
              >
                {icon}
              </span>
            ) : null}
            {/* `min-w-0` for the reason select.web.tsx spells out: a flex item
                will not shrink below its own text, so without it a long label
                pushes the row wider instead of eliding inside it. */}
            <span className="min-w-0 truncate font-body text-sm text-ink">{label}</span>
          </div>
          {/* A collapsed branch's children never mount at all — same call
              accordion.web.tsx and tabs.web.tsx make for their own panels,
              and the assumption tree-view.props.ts's `visibleOrder` states
              outright. */}
          {isBranch && open ? (
            <ul role="group" className="m-0 flex list-none flex-col gap-px p-0">
              {children}
            </ul>
          ) : null}
        </li>
      </TreeViewItemContext.Provider>
    );
  },
);
TreeViewItem.displayName = 'TreeView.Item';

export const TreeView = {
  Root: TreeViewRoot,
  Item: TreeViewItem,
};
