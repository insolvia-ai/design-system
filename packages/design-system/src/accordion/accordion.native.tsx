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
  if (!open) return null;
  // A plain View, exactly like Tabs' panel — arbitrary content is the point of
  // a panel, and raw text needs the caller's own `<Text>`, the same rule as
  // everywhere else in React Native.
  //
  // This leaf used to force-wrap every child in a `Text`, which made it the one
  // container in the package a consumer could not put a `View` inside. On a
  // device that nesting is invalid outright; through react-native-web it failed
  // quietly instead, which is worse — the wrapper carries `display: inline` and
  // sets the text-ancestor context, so a flex layout inside collapsed into
  // inline flow and a nested `Text` re-rendered as a `<span>` with
  // `color: inherit`, losing its own colour.
  //
  // ONE ASYMMETRY WITH THE WEB LEAF, and it is inherent rather than an
  // oversight: accordion.web.tsx styles panel prose by CSS cascade
  // (`text-sm text-muted` on the container). React Native has no cascade, so a
  // native caller styles its own `<Text>` to match. Wrapping here was the only
  // way to close that gap and it cost the container — Tabs made the same trade
  // and this leaf now agrees with it.
  return <View style={styles.panel}>{children}</View>;
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
  // Spacing only. The panel no longer styles its content's text — see the
  // asymmetry note on AccordionPanel.
  panel: { paddingBottom: spacing.md },
});
