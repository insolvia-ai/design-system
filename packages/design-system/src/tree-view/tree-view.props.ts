// SHARED — imports `react` and `../lib/controllable` only. No react-dom, no
// react-native. This is TreeView's entire behavior model: expand/select state
// (both controlled-or-uncontrolled, via `useControllableState`), the
// parent/depth an Item derives from its nearest ancestor Item, and the
// registry + `visibleOrder` pair the web leaf's arrow-key grammar is built on.
// Rendering diverges completely — a `<ul role="tree">` of `<li>`s against
// nested Views of Pressables — and stays in the leaves.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export interface TreeViewRootContextValue {
  expanded: string[];
  isExpanded: (value: string) => boolean;
  setExpanded: (value: string, open: boolean) => void;
  selected: string | null;
  select: (value: string) => void;
  /**
   * The last item to receive real focus — web-only roving-tabindex state; the
   * native leaf never reads it. Starts at `null` (nothing has been focused
   * yet), so a fresh mount falls back to the selected item, then the first
   * rendered one — see `isTreeItemTabbable`.
   */
  activeValue: string | null;
  setActiveValue: (value: string) => void;
  disabled: boolean;
  registry: TreeRegistry;
}

export const TreeViewRootContext = React.createContext<TreeViewRootContextValue | null>(null);

export function useTreeViewRootContext(part: string): TreeViewRootContextValue {
  const ctx = React.useContext(TreeViewRootContext);
  if (!ctx) throw new Error(`TreeView.${part} must be rendered inside <TreeView.Root>`);
  return ctx;
}

export interface TreeViewItemContextValue {
  value: string;
  /** `null` for a root-level item — it has no ancestor `Item`. */
  parentValue: string | null;
  /** Root-level items are depth 0; `aria-level` on the web leaf is `depth + 1`. */
  depth: number;
}

export const TreeViewItemContext = React.createContext<TreeViewItemContextValue | null>(null);

/** The nearest ancestor `Item`'s context, or `null` at the root. Not a `use*Context`
 *  guard-and-throw helper like the others — being outside any `Item` is the
 *  valid, common case for a top-level item, not a misuse. */
export function useTreeViewParent(): TreeViewItemContextValue | null {
  return React.useContext(TreeViewItemContext);
}

export interface TreeViewRootOwnProps {
  /** Controlled set of expanded item values. Pair with `onExpandedChange`. */
  expanded?: string[] | undefined;
  /** Expanded set on first render. Uncontrolled; omit for an all-collapsed start. */
  defaultExpanded?: string[] | undefined;
  onExpandedChange?: ((next: string[]) => void) | undefined;
  /** Controlled selection — at most one item. Pair with `onSelectedChange`. */
  selected?: string | null | undefined;
  /** Selected item on first render. Uncontrolled; omit for no initial selection. */
  defaultSelected?: string | null | undefined;
  onSelectedChange?: ((next: string | null) => void) | undefined;
  /** Names the tree for assistive tech — there is no visible heading otherwise. */
  label?: string | undefined;
  /** Disables every item; an item may also disable itself individually. */
  disabled?: boolean | undefined;
}

/**
 * The expand/select state machine — pure React, identical on both platforms.
 * Selection holds at most one value; expansion holds any number.
 */
export function useTreeViewState(
  expandedProp: string[] | undefined,
  defaultExpanded: string[] | undefined,
  onExpandedChange: ((next: string[]) => void) | undefined,
  selectedProp: string | null | undefined,
  defaultSelected: string | null | undefined,
  onSelectedChange: ((next: string | null) => void) | undefined,
  disabled: boolean,
): TreeViewRootContextValue {
  const [expandedValues, setExpandedValues] = useControllableState<string[]>(
    expandedProp,
    defaultExpanded ?? [],
    onExpandedChange,
  );
  const [selectedValue, setSelectedValue] = useControllableState<string | null>(
    selectedProp,
    defaultSelected ?? null,
    onSelectedChange,
  );
  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const registry = useTreeRegistry();

  const isExpanded = React.useCallback(
    (value: string) => expandedValues.includes(value),
    [expandedValues],
  );

  const setExpanded = React.useCallback(
    (value: string, open: boolean) => {
      const isOpen = expandedValues.includes(value);
      if (open === isOpen) return;
      setExpandedValues(
        open ? [...expandedValues, value] : expandedValues.filter((v) => v !== value),
      );
    },
    [expandedValues, setExpandedValues],
  );

  const select = React.useCallback((value: string) => setSelectedValue(value), [setSelectedValue]);

  return React.useMemo(
    () => ({
      expanded: expandedValues,
      isExpanded,
      setExpanded,
      selected: selectedValue,
      select,
      activeValue,
      setActiveValue,
      disabled,
      registry,
    }),
    [
      expandedValues,
      isExpanded,
      setExpanded,
      selectedValue,
      select,
      activeValue,
      disabled,
      registry,
    ],
  );
}

export interface TreeRegistryEntry {
  value: string;
  parentValue: string | null;
  depth: number;
}

export interface TreeRegistry {
  /** Called by an Item on mount (and again if its parent/depth ever changes). */
  register: (entry: TreeRegistryEntry) => void;
  /** Called by an Item on unmount. */
  unregister: (value: string) => void;
  /** A snapshot, read fresh at the moment it is needed — see `visibleOrder`. */
  entries: () => TreeRegistryEntry[];
}

/**
 * A plain mutable registry, not React state on purpose: Items register
 * themselves as a side effect of mounting, and nothing here should re-render
 * `Root` when that happens — the same reason accordion.web.tsx and
 * tabs.web.tsx query the DOM at the moment of a keypress instead of keeping a
 * live list in state. This registry is that idea's renderer-agnostic form: the
 * web leaf still resolves an actual element to call `.focus()` on via
 * `data-tree-item`, but the ORDER it navigates comes from here, which is what
 * lets that order be unit-tested (`visibleOrder`, below) without a DOM at all.
 */
export function useTreeRegistry(): TreeRegistry {
  const map = React.useRef(new Map<string, TreeRegistryEntry>());
  return React.useMemo<TreeRegistry>(
    () => ({
      register: (entry) => {
        map.current.set(entry.value, entry);
      },
      unregister: (value) => {
        map.current.delete(value);
      },
      entries: () => Array.from(map.current.values()),
    }),
    [],
  );
}

/**
 * Registers this item into the tree's registry for the lifetime of its mount,
 * deriving its depth and parent from the nearest ancestor `Item` (a root-level
 * item has none: depth 0, `parentValue` null). Identical on both leaves — pure
 * state bookkeeping, no elements involved.
 */
export function useTreeViewItemState(value: string): TreeViewItemContextValue {
  const parent = useTreeViewParent();
  const { registry } = useTreeViewRootContext('Item');
  const depth = parent ? parent.depth + 1 : 0;
  const parentValue = parent ? parent.value : null;

  React.useEffect(() => {
    registry.register({ value, parentValue, depth });
    return () => registry.unregister(value);
  }, [registry, value, parentValue, depth]);

  return React.useMemo(() => ({ value, parentValue, depth }), [value, parentValue, depth]);
}

/**
 * The flat list of currently-VISIBLE item values, in tree order — what
 * ArrowDown/ArrowUp/Home/End walk.
 *
 * `registry` need not already be in full document order: React's mount
 * effects fire children-before-their-own-parent (a postorder), not the
 * preorder a reader would guess, so raw registration order alone is not tree
 * order. What IS guaranteed, and all this function relies on, is that entries
 * sharing the same `parentValue` keep their relative left-to-right order —
 * siblings' subtrees are always processed as contiguous, ordered blocks,
 * whichever traversal produced the array. So this groups entries by parent
 * (preserving that relative order), then walks down from the root, only
 * descending into a node's children when `expanded` says it is open.
 *
 * A collapsed branch's children never mount at all in this package's leaves
 * (same call accordion/tabs make for their panels), so in practice `registry`
 * already holds only what is reachable — `expanded` mainly matters for this
 * function's own unit tests, which construct registries by hand rather than
 * through real mounts.
 */
export function visibleOrder(
  registry: readonly TreeRegistryEntry[],
  expanded: readonly string[],
): string[] {
  const expandedSet = new Set(expanded);
  const childrenOf = new Map<string | null, string[]>();
  for (const entry of registry) {
    const siblings = childrenOf.get(entry.parentValue);
    if (siblings) siblings.push(entry.value);
    else childrenOf.set(entry.parentValue, [entry.value]);
  }

  const order: string[] = [];
  const walk = (parentValue: string | null) => {
    for (const value of childrenOf.get(parentValue) ?? []) {
      order.push(value);
      if (expandedSet.has(value)) walk(value);
    }
  };
  walk(null);
  return order;
}

/**
 * Roving-tabindex rule for a single-select tree, the same shape as
 * RadioGroup's `radioItemTabIndex`: the last item that actually received DOM
 * focus is always tabbable; before any focus has happened, the selected item
 * is, falling back to the first rendered item when nothing is selected
 * either. `isFirst` is a DOM fact only the web leaf can supply (same reasoning
 * as `radioItemTabIndex`'s) — this function is the pure arithmetic on top of
 * it.
 */
export function isTreeItemTabbable(
  value: string,
  activeValue: string | null,
  selected: string | null,
  isFirst: boolean,
): boolean {
  if (activeValue !== null) return activeValue === value;
  if (selected !== null) return selected === value;
  return isFirst;
}

export interface TreeViewItemOwnProps {
  /** This item's identity — what `Root`'s `selected`/`expanded` compare against. */
  value: string;
  /** The row's visible text, and (when it is a string) its accessible name. */
  label: React.ReactNode;
  /**
   * Nested `TreeView.Item`s. An Item WITH children is a branch — it gets a
   * chevron and can expand; an Item with none is a leaf. There is no separate
   * `variant` prop for this because it is never something a caller has to get
   * right independently of the tree shape they already wrote.
   */
  children?: React.ReactNode;
  disabled?: boolean | undefined;
  /** A leading, decorative slot — a file/folder glyph, say. Never the accessible name. */
  icon?: React.ReactNode;
}
