// NATIVE LEAF — React Native primitives, faithful single-item disclosure.
// Shares the exact state model with the web leaf (collapsible.props); what is
// reimplemented here is every rendered element and the a11y surface: RN has
// no <button>/region, so the trigger maps onto Pressable +
// accessibilityState/accessibilityRole, and the collapsed panel is unmounted
// rather than height-animated (no CSS grid trick in RN) — the same idiom
// accordion.native.tsx uses for its panel, which the panel below also matches
// in taking arbitrary children rather than prose alone.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  CollapsibleRootContext,
  useCollapsibleRootContext,
  useCollapsibleState,
  type CollapsibleRootOwnProps,
} from './collapsible.props';

export interface CollapsibleRootProps extends ViewProps, CollapsibleRootOwnProps {}

const CollapsibleRoot = ({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  children,
  style,
  ...props
}: CollapsibleRootProps) => {
  const ctx = useCollapsibleState(open, defaultOpen, onOpenChange, disabled);
  return (
    <CollapsibleRootContext.Provider value={ctx}>
      <View style={[styles.root, style]} {...props}>
        {children}
      </View>
    </CollapsibleRootContext.Provider>
  );
};

const CollapsibleTrigger = ({ children }: { children?: React.ReactNode }) => {
  const { toggle, open, disabled } = useCollapsibleRootContext('Trigger');
  const c = useNativeColors();
  return (
    <Pressable
      accessibilityRole="button"
      // See accordion.native.tsx: react-native-web ignores the nested
      // `accessibilityState`, so the `aria-*` props are what actually reach the
      // DOM on the web build. `disabled` is the exception it does map, but it
      // is spelled out here too rather than relying on that asymmetry.
      accessibilityState={{ expanded: open, disabled }}
      aria-expanded={open}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={toggle}
      style={styles.trigger}
    >
      <Text style={[styles.triggerLabel, { color: disabled ? c.muted : c.ink }]}>{children}</Text>
    </Pressable>
  );
};

const CollapsiblePanel = ({ children }: { children?: React.ReactNode }) => {
  const { open } = useCollapsibleRootContext('Panel');
  if (!open) return null; // unmount rather than height-animate — no CSS grid trick in RN
  // A plain View that passes children through — see accordion.native.tsx's
  // panel, which carries the full reasoning including the one asymmetry with
  // the web leaf. A disclosure hides a section of a page, and a section is not
  // always prose.
  return <View style={styles.panel}>{children}</View>;
};

export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Panel: CollapsiblePanel,
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  triggerLabel: { ...textScale.sm, fontWeight: '500' },
  // Spacing only — the panel no longer styles its content's text.
  panel: { paddingBottom: spacing.sm },
});
