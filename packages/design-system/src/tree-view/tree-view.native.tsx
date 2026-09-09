// NATIVE LEAF — React Native primitives, faithful to the same WAI-ARIA
// TreeView semantics via accessibilityRole/accessibilityState. Shares the
// exact state model with the web leaf (tree-view.props); what diverges here is
// the touch surface:
//
// 1. NO KEYBOARD GRAMMAR. RN has no arrow-key concept — every other complex
//    widget in this package (Tabs, Select) leaves the whole keyboard story to
//    the `.web` leaf, and this one is no exception. `select.native.tsx` still
//    carries key handling because a React Native consumer can render THAT leaf
//    on the web through react-native-web; this leaf never needs to, since the
//    web leaf is what a web consumer's bundler resolves.
// 2. SELECT AND EXPAND ARE TWO SEPARATE PRESSABLES, not one shared click
//    target the way the web leaf's row is. A phone has no hover state and no
//    "click near the chevron" precision a mouse has — collapsing both actions
//    onto one row-wide tap means a reader can never open a folder without also
//    selecting it (or the reverse). So the chevron gets its OWN Pressable and
//    its own 44dp hit area, the same reasoning icon-button.native.tsx
//    documents for its hitSlop.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  TreeViewItemContext,
  TreeViewRootContext,
  useTreeViewItemState,
  useTreeViewRootContext,
  useTreeViewState,
  type TreeViewItemOwnProps,
  type TreeViewRootOwnProps,
} from './tree-view.props';

export interface TreeViewRootProps extends Omit<ViewProps, 'children'>, TreeViewRootOwnProps {
  children?: React.ReactNode;
}

const TreeViewRoot = ({
  expanded,
  defaultExpanded,
  onExpandedChange,
  selected,
  defaultSelected,
  onSelectedChange,
  label = 'Tree',
  disabled = false,
  children,
  style,
  ...props
}: TreeViewRootProps) => {
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
      <View
        accessibilityRole="list"
        accessibilityLabel={label}
        style={[styles.root, style]}
        {...props}
      >
        {children}
      </View>
    </TreeViewRootContext.Provider>
  );
};

export interface TreeViewItemProps extends Omit<ViewProps, 'children'>, TreeViewItemOwnProps {}

const TreeViewItem = ({
  value,
  label,
  disabled: itemDisabled = false,
  icon,
  children,
  style,
  ...props
}: TreeViewItemProps) => {
  const root = useTreeViewRootContext('Item');
  const itemCtx = useTreeViewItemState(value);
  const c = useNativeColors();
  // Two INDEPENDENT rings, one per touch target — a keyboard user reaching
  // this leaf through react-native-web (the workbench, or a web build of a
  // React Native consumer) tabs through the row and the chevron as two
  // distinct stops, and each needs its own visible focus state.
  const rowFocus = useNativeFocusRing();
  const chevronFocus = useNativeFocusRing();
  const body = useNativeBodyFamily();

  const disabled = root.disabled || itemDisabled;
  const isBranch = children !== undefined && children !== null;
  const open = isBranch && root.isExpanded(value);
  const selected = root.selected === value;
  const isTextLabel = typeof label === 'string' || typeof label === 'number';

  return (
    <TreeViewItemContext.Provider value={itemCtx}>
      {/* `role="listitem"` on the whole item — row plus its nested children
          container — is what makes this leaf legal under axe's `list` rule:
          a `list`/`role="list"` may only contain `listitem` children, and
          without this wrapper the row Pressables (rendered as
          `<button role="button">` by react-native-web) sat directly inside
          the `role="list"` Root, which is what every TreeView story failed
          axe on. The wrapper costs nothing on a real device. */}
      <View role="listitem" style={style} {...props}>
        {/* The chevron and the row are SIBLINGS under this flex-row
            container, never one nested inside the other. A first draft put
            the chevron INSIDE the row Pressable, which react-native-web
            renders as a literal `<button>` — nesting one interactive element
            inside another is invalid HTML, and a real browser silently
            re-parents the inner one out, breaking the very hit-testing this
            split exists to get right. Two touch targets means two SIBLINGS,
            not a target inside a target. */}
        <View
          style={[
            styles.rowContainer,
            { paddingLeft: itemCtx.depth * 16 + 8 },
            { backgroundColor: selected ? c.surfaceAlt : 'transparent' },
            disabled && styles.disabled,
          ]}
        >
          {isBranch ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={open ? 'Collapse' : 'Expand'}
              disabled={disabled}
              testID={`tree-item-${value}-chevron`}
              // The 44dp hit area, in this platform's dialect — see
              // icon-button.native.tsx. The glyph stays a small 24dp box; only
              // the TOUCH target grows.
              hitSlop={10}
              onPress={disabled ? undefined : () => root.setExpanded(value, !open)}
              onFocus={chevronFocus.focus}
              onBlur={chevronFocus.blur}
              style={[styles.chevron, chevronFocus.ringStyle]}
            >
              {/* No body family: a chevron in a fixed box keeps the platform face. */}
              <Text
                aria-hidden
                style={[
                  styles.chevronGlyph,
                  { color: c.muted },
                  open ? styles.chevronOpen : undefined,
                ]}
              >
                {'▸'}
              </Text>
            </Pressable>
          ) : (
            // An empty slot the same width as a chevron, so a leaf row's
            // label lines up with a branch sibling's — the web leaf's own
            // placeholder span does the same job.
            <View style={styles.chevron} />
          )}
          <Pressable
            accessibilityRole="button"
            // Reported BOTH ways, the pattern list.native.tsx and
            // radio-group.native.tsx document: `accessibilityState` for the
            // real native platforms, and the explicit `aria-*` props for
            // react-native-web, whose DOM translation does not derive
            // `aria-expanded` from the nested object on its own. `disabled`
            // is the one exception — passing the real Pressable `disabled`
            // prop below derives `aria-disabled` automatically, so there is
            // nothing extra to say for it here.
            //
            // Selection is mirrored as `aria-current="true"`, not
            // `aria-selected` — the same substitution stepper.native.tsx
            // makes for its active step. `aria-selected` is only valid on
            // option/tab/treeitem/gridcell roles per ARIA, and this row is a
            // `role="button"` (RN has no `treeitem` accessibilityRole);
            // axe's `aria-allowed-attr` rule failed every TreeView story on
            // exactly this.
            accessibilityState={{ selected, expanded: isBranch ? open : undefined, disabled }}
            aria-current={selected ? 'true' : undefined}
            aria-expanded={isBranch ? open : undefined}
            accessibilityLabel={typeof label === 'string' ? label : undefined}
            // Extra guidance ONLY on a branch: a screen-reader user on a
            // touch device cannot see that a second, separate control sits
            // beside this row, so the hint says so — a leaf row has nothing
            // more to add than its own label.
            accessibilityHint={
              isBranch ? 'Has nested items. Use the expand button to view them.' : undefined
            }
            disabled={disabled}
            testID={`tree-item-${value}`}
            onPress={disabled ? undefined : () => root.select(value)}
            onFocus={rowFocus.focus}
            onBlur={rowFocus.blur}
            style={[styles.row, rowFocus.ringStyle]}
          >
            {icon !== undefined ? (
              <View accessible={false} style={styles.icon}>
                {/* A string icon is a glyph in a fixed 16dp box, not body copy — no family. */}
                {typeof icon === 'string' ? <Text style={{ color: c.muted }}>{icon}</Text> : icon}
              </View>
            ) : null}
            {isTextLabel ? (
              <Text numberOfLines={1} style={[styles.label, { fontFamily: body, color: c.ink }]}>
                {label}
              </Text>
            ) : (
              <View style={styles.labelWrap}>{label}</View>
            )}
          </Pressable>
        </View>
        {/* A collapsed branch's children never mount — same call the web leaf
            makes, and the assumption tree-view.props.ts's `visibleOrder`
            states outright. `accessibilityRole="list"` keeps the nesting
            legal for axe's `list` rule — list > listitem > list > listitem —
            the same shape the Root wrapper starts. */}
        {isBranch && open ? <View accessibilityRole="list">{children}</View> : null}
      </View>
    </TreeViewItemContext.Provider>
  );
};

export const TreeView = {
  Root: TreeViewRoot,
  Item: TreeViewItem,
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },
  // The shared row shell — chevron and the selectable Pressable both live
  // inside this, indentation and the selected/disabled paint apply here so
  // the whole row (not just one of its two touch targets) reads as one unit.
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    // 44dp, the WCAG 2.5.5 target-size floor every press target in this
    // package holds.
    minHeight: 44,
    paddingRight: spacing.sm,
  },
  // The selectable Pressable fills whatever width the chevron leaves it —
  // it is the ROW in "tap a row to select", so most of the width is its hit
  // area, and its own minHeight keeps it 44dp tall even where the shared
  // rowContainer's is satisfied by the chevron next to it instead.
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  disabled: { opacity: 0.5 },
  chevron: {
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronGlyph: { fontSize: 14 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  icon: { height: 16, width: 16, alignItems: 'center', justifyContent: 'center' },
  label: { flexShrink: 1, ...textScale.sm },
  labelWrap: { flexShrink: 1 },
});
