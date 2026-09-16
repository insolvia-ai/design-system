// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// The menu is inline and absolutely positioned under the trigger, as Select's
// list is, and it is driven by press rather than by focus: React Native has no
// roving tabindex to rove, and a touch screen has no arrow keys to rove with.
// The web leaf's whole keyboard walk therefore has no counterpart here — which
// is why dropdown.props.ts deliberately keeps the grammar OUT of the shared
// module rather than sharing a machine only one leaf could ever run.
//
// Dismissal is the same limitation Popover's native leaf documents: without a
// Modal there is no press-anywhere to listen for, so the menu closes by
// choosing an item or pressing the trigger again.
//
// SUB-MENUS EXPAND IN PLACE rather than flying out to the right as the web
// leaf's do. A flyout needs room beside the menu, and a phone has none: the
// menu already sits at the edge of a screen a few hundred points wide. So the
// sub trigger is a row that, when pressed, unfolds its rows directly beneath
// it, indented — a disclosure, in the shape a touch user already knows. The
// roles are the web leaf's exactly: a `menuitem` with `aria-haspopup="menu"`
// and `aria-expanded`, and a second `menu` labelled by it.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
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

export interface DropdownRootProps extends DropdownRootOwnProps {
  children?: React.ReactNode;
}

const DropdownRoot = ({ open, defaultOpen, onOpenChange, children }: DropdownRootProps) => {
  const ctx = useDropdownState(open, defaultOpen, onOpenChange);
  return (
    <DropdownContext.Provider value={ctx}>
      <View style={[styles.root, ctx.open && styles.rootOpen]}>{children}</View>
    </DropdownContext.Provider>
  );
};

export interface DropdownTriggerProps {
  children?: React.ReactNode;
}

const DropdownTrigger = ({ children }: DropdownTriggerProps) => {
  const { open, setOpen, menuId, triggerId } = useDropdownContext('Trigger');
  const c = useNativeColors();
  const body = useNativeBodyFamily();

  const webAria = {
    'aria-haspopup': 'menu',
    ...(open ? { 'aria-controls': menuId } : {}),
  } as object;

  return (
    <Pressable
      nativeID={triggerId}
      accessibilityRole="button"
      // Both spellings — accordion.native.tsx has the reasoning: a device
      // reads the nested state, react-native-web only the flat prop.
      accessibilityState={{ expanded: open }}
      aria-expanded={open}
      {...webAria}
      onPress={() => setOpen(!open)}
      style={styles.trigger}
    >
      <Text style={[styles.triggerLabel, { fontFamily: body }, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

export interface DropdownContentProps extends ViewProps {
  children?: React.ReactNode;
}

const DropdownContent = ({ style, children, ...props }: DropdownContentProps) => {
  const { open, menuId, triggerId } = useDropdownContext('Content');
  const c = useNativeColors();
  const r = useNativeRadii();
  if (!open) return null;

  // RN's `Role` union carries 'menu' and 'menuitem'; `aria-labelledby` on a
  // View does not exist in its types, and react-native-web forwards it to the
  // DOM regardless — the same containment shape as Select's native leaf.
  const webAria = { 'aria-labelledby': triggerId } as object;

  return (
    <View
      nativeID={menuId}
      role="menu"
      {...webAria}
      style={[
        styles.content,
        { borderRadius: r.md },
        { borderColor: c.line, backgroundColor: c.card },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export interface DropdownItemProps extends DropdownItemOwnProps {
  children?: React.ReactNode;
}

const DropdownItem = ({ disabled = false, onSelect, children }: DropdownItemProps) => {
  const { setOpen } = useDropdownContext('Item');
  const c = useNativeColors();
  const body = useNativeBodyFamily();
  return (
    <Pressable
      role="menuitem"
      // Matches the web leaf: `aria-disabled` rather than removal, so the item
      // stays discoverable, with the press guard making it inert.
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        onSelect?.();
        setOpen(false);
      }}
      style={({ pressed }) => [
        styles.item,
        pressed && !disabled ? { backgroundColor: c.surfaceAlt } : null,
      ]}
    >
      <Text style={[styles.itemLabel, { fontFamily: body }, { color: disabled ? c.muted : c.ink }]}>
        {children}
      </Text>
    </Pressable>
  );
};

/**
 * A section heading. Hidden from assistive tech for the same reason the web
 * leaf hides it: `role="menu"` wants menu items, groups and separators as its
 * children, and a labelled stray would be an `aria-required-children` failure.
 */
const DropdownLabel = ({ children }: { children?: React.ReactNode }) => {
  const c = useNativeColors();
  const body = useNativeBodyFamily();
  return (
    <View accessible={false} style={styles.label}>
      <Text style={[styles.labelText, { fontFamily: body }, { color: c.muted }]}>{children}</Text>
    </View>
  );
};

const DropdownDivider = () => {
  const c = useNativeColors();
  return <View role="separator" style={[styles.divider, { backgroundColor: c.line }]} />;
};

// ---------------------------------------------------------------------------
// Sub-menus.

export interface DropdownSubProps extends DropdownSubOwnProps {
  children?: React.ReactNode;
}

const DropdownSub = ({ open, defaultOpen, onOpenChange, children }: DropdownSubProps) => {
  const ctx = useDropdownSubState(open, defaultOpen, onOpenChange);
  return (
    <DropdownSubContext.Provider value={ctx}>
      {/* `accessible={false}`, the same hiding Label uses: a `menu` may own
          items, groups, separators and menus, and this wrapper is none. */}
      <View accessible={false}>{children}</View>
    </DropdownSubContext.Provider>
  );
};

export interface DropdownSubTriggerProps {
  children?: React.ReactNode;
}

const DropdownSubTrigger = ({ children }: DropdownSubTriggerProps) => {
  const { open, setOpen, subMenuId, subTriggerId } = useDropdownSubContext('SubTrigger');
  const c = useNativeColors();
  const body = useNativeBodyFamily();

  const webAria = {
    'aria-haspopup': 'menu',
    ...(open ? { 'aria-controls': subMenuId } : {}),
  } as object;

  return (
    <Pressable
      nativeID={subTriggerId}
      role="menuitem"
      // Both spellings, as accordion.native.tsx explains: react-native-web
      // reads the flat prop and ignores the nested state's `expanded`, and
      // a device reads the nested state.
      accessibilityState={{ expanded: open }}
      aria-expanded={open}
      {...webAria}
      onPress={() => setOpen(!open)}
      style={({ pressed }) => [
        styles.item,
        styles.subTrigger,
        pressed ? { backgroundColor: c.surfaceAlt } : null,
      ]}
    >
      <Text style={[styles.itemLabel, { fontFamily: body }, { color: c.ink }]}>{children}</Text>
      {/* A glyph in a fixed box — the body family carve-out. Points down when
          the rows are unfolded beneath, which is where they go here; the web
          leaf's points right, to where its flyout goes. */}
      <Text aria-hidden style={[styles.subGlyph, { color: c.muted }]}>
        {open ? '⌄' : '›'}
      </Text>
    </Pressable>
  );
};

export interface DropdownSubContentProps extends ViewProps {
  children?: React.ReactNode;
}

const DropdownSubContent = ({ style, children, ...props }: DropdownSubContentProps) => {
  const { open, subMenuId, subTriggerId } = useDropdownSubContext('SubContent');
  const c = useNativeColors();
  if (!open) return null;

  const webAria = { 'aria-labelledby': subTriggerId } as object;

  return (
    <View
      nativeID={subMenuId}
      role="menu"
      {...webAria}
      style={[styles.subContent, { borderColor: c.line }, style]}
      {...props}
    >
      {children}
    </View>
  );
};

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

const styles = StyleSheet.create({
  root: { position: 'relative', alignSelf: 'flex-start' },
  rootOpen: { zIndex: 20 },
  trigger: { alignSelf: 'flex-start' },
  triggerLabel: { ...textScale.base, fontWeight: '500' },
  content: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: spacing.xs,
    zIndex: 20,
    minWidth: 192,
    borderWidth: 1,
    paddingVertical: spacing.xs,
  },
  item: {
    // Matches the web leaf's `min-h-[44px]` — the WCAG 2.5.5 target-size floor
    // Select's option rows already hold.
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  itemLabel: { ...textScale.sm },
  label: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  labelText: { ...textScale.xs, fontWeight: '600' },
  divider: { height: 1, marginVertical: spacing.xs },
  subTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subGlyph: { ...textScale.sm, marginLeft: spacing.sm },
  // Unfolded beneath the trigger and set in from the left by a rule, so the
  // rows read as belonging to the trigger above rather than to the menu.
  subContent: { marginLeft: spacing.sm, borderLeftWidth: 1 },
});
