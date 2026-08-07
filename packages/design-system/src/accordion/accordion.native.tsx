// NATIVE LEAF — React Native primitives, faithful accordion. Shares the exact
// state model with the web leaf (accordion.props); what is reimplemented here is
// every rendered element and the a11y surface: RN has no <button>/<h3>/region,
// so behavior maps onto Pressable + accessibilityState/accessibilityRole, and
// the collapsed panel is unmounted rather than height-animated.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  AccordionItemContext,
  AccordionRootContext,
  useAccordionItemState,
  useAccordionItemContext,
  useAccordionRootContext,
  useAccordionState,
  type AccordionRootOwnProps,
} from './accordion.props';

export interface AccordionRootProps extends ViewProps, AccordionRootOwnProps {}

const AccordionRoot = ({
  defaultValue,
  openMultiple = true,
  children,
  style,
  ...props
}: AccordionRootProps) => {
  const ctx = useAccordionState(defaultValue, openMultiple);
  return (
    <AccordionRootContext.Provider value={ctx}>
      <View style={[styles.root, style]} {...props}>
        {children}
      </View>
    </AccordionRootContext.Provider>
  );
};

export interface AccordionItemProps extends ViewProps {
  value: string;
}

const AccordionItem = ({ value, children, style, ...props }: AccordionItemProps) => {
  const { isOpen } = useAccordionRootContext('Item');
  const ctx = useAccordionItemState(value, isOpen);
  const c = useNativeColors();
  return (
    <AccordionItemContext.Provider value={ctx}>
      <View style={[styles.item, { borderBottomColor: c.line }, style]} {...props}>
        {children}
      </View>
    </AccordionItemContext.Provider>
  );
};

const AccordionHeader = ({ children }: { children?: React.ReactNode }) => (
  <View accessibilityRole="header">{children}</View>
);

const AccordionTrigger = ({ children }: { children?: React.ReactNode }) => {
  const { toggle } = useAccordionRootContext('Trigger');
  const { value, open } = useAccordionItemContext('Trigger');
  const c = useNativeColors();
  return (
    <Pressable
      accessibilityRole="button"
      // BOTH forms, and the duplication is required — same reasoning as
      // checkbox.native.tsx. `accessibilityState` is the correct React Native
      // prop and is what a real device reads; react-native-web does NOT derive
      // `aria-expanded` from it (its createDOMProps handles the flat
      // `accessibilityExpanded`/`aria-expanded` props and ignores the nested
      // object entirely). Setting only the RN form means that on the web build
      // the trigger announces no expanded state at all — WCAG 4.1.2, and
      // invisible to any test that only checks the panel mounting.
      accessibilityState={{ expanded: open }}
      aria-expanded={open}
      onPress={() => toggle(value)}
      style={styles.trigger}
    >
      <Text style={[styles.triggerLabel, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

const AccordionPanel = ({ children }: { children?: React.ReactNode }) => {
  const { open } = useAccordionItemContext('Panel');
  const c = useNativeColors();
  if (!open) return null;
  return (
    <View style={styles.panel}>
      <Text style={[styles.panelText, { color: c.muted }]}>{children}</Text>
    </View>
  );
};

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },
  item: { borderBottomWidth: 1 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  triggerLabel: { ...textScale.base, fontWeight: '500' },
  panel: { paddingBottom: spacing.md },
  panelText: { ...textScale.sm },
});
