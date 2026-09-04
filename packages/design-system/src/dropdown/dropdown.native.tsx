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
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  DropdownContext,
  useDropdownContext,
  useDropdownState,
  type DropdownItemOwnProps,
  type DropdownRootOwnProps,
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

  const webAria = {
    'aria-haspopup': 'menu',
    ...(open ? { 'aria-controls': menuId } : {}),
  } as object;

  return (
    <Pressable
      nativeID={triggerId}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      {...webAria}
      onPress={() => setOpen(!open)}
      style={styles.trigger}
    >
      <Text style={[styles.triggerLabel, { color: c.ink }]}>{children}</Text>
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
      <Text style={[styles.itemLabel, { color: disabled ? c.muted : c.ink }]}>{children}</Text>
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
  return (
    <View accessible={false} style={styles.label}>
      <Text style={[styles.labelText, { color: c.muted }]}>{children}</Text>
    </View>
  );
};

const DropdownDivider = () => {
  const c = useNativeColors();
  return <View role="separator" style={[styles.divider, { backgroundColor: c.line }]} />;
};

export const Dropdown = {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  Item: DropdownItem,
  Label: DropdownLabel,
  Divider: DropdownDivider,
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
});
