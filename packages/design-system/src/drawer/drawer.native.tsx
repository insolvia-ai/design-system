// NATIVE LEAF — RN's Modal, exactly as Dialog's native leaf uses it: the Modal
// supplies portal-like hosting, focus containment and hardware dismissal
// (`onRequestClose` — the Android back button, which react-native-web maps to
// Escape). The scrim is rendered BY the panel inside the Modal, so the
// Backdrop part renders nothing and exists only so cross-platform call sites
// compose identically.
//
// What differs from Dialog is the panel's geometry: it fills one edge instead
// of floating in the middle, which is `edgeStyles` below.
import * as React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale, useNativeHeadingFamily } from '../lib/native-typography';
import {
  DrawerRootContext,
  useDrawerRootContext,
  useDrawerState,
  type DrawerRootOwnProps,
  type DrawerSide,
} from './drawer.props';

export interface DrawerRootProps extends DrawerRootOwnProps {
  children?: React.ReactNode;
}

const DrawerRoot = ({
  open,
  defaultOpen,
  onOpenChange,
  side = 'right',
  children,
}: DrawerRootProps) => {
  const state = useDrawerState(open, defaultOpen, onOpenChange);
  const ctx = React.useMemo(() => ({ ...state, side }), [state, side]);
  return <DrawerRootContext.Provider value={ctx}>{children}</DrawerRootContext.Provider>;
};

const DrawerTrigger = ({ children }: { children?: React.ReactNode }) => {
  const { open, setOpen } = useDrawerRootContext('Trigger');
  const c = useNativeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen(true)}
      style={styles.trigger}
    >
      <Text style={[styles.triggerLabel, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

// The Modal owns the overlay, so a standalone backdrop has nothing to render.
// Kept as a part so the same JSX composes on both leaves.
const DrawerBackdrop = (_props: { children?: React.ReactNode }) => null;

export interface DrawerPanelProps extends ViewProps {
  side?: DrawerSide | undefined;
  children?: React.ReactNode;
}

const DrawerPanel = ({ side: sideProp, children, style, ...props }: DrawerPanelProps) => {
  const { open, setOpen, titleId, descriptionId, side: rootSide } = useDrawerRootContext('Panel');
  const side = sideProp ?? rootSide;
  const c = useNativeColors();

  let hasTitle = false;
  let hasDescription = false;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === DrawerTitle) hasTitle = true;
    if (child.type === DrawerDescription) hasDescription = true;
  });

  // The Modal's own container IS the dialog element under react-native-web —
  // it renders with role="dialog" and aria-modal and forwards extra props onto
  // that element — so the labelling belongs on <Modal>, not on the inner
  // panel. `aria-describedby` is web-only and outside RN's types; omitted
  // rather than undefined when absent. Same shape as Dialog's native leaf.
  const modalAria = {
    ...(hasDescription ? { 'aria-describedby': descriptionId } : {}),
  } as Partial<React.ComponentProps<typeof Modal>>;

  return (
    <Modal
      transparent
      visible={open}
      onRequestClose={() => setOpen(false)}
      aria-labelledby={hasTitle ? titleId : undefined}
      {...modalAria}
    >
      {/* `${c.ink}80` is the ink token at ~50% alpha (#rrggbbaa) — the scrim
          stays scheme-aware without inventing a new token, the same trick
          Dialog's native leaf uses. */}
      <View style={[styles.overlay, edgeAlignment[side], { backgroundColor: `${c.ink}80` }]}>
        <Pressable
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        />
        <View
          style={[
            styles.panel,
            edgeStyles[side],
            { backgroundColor: c.card, borderColor: c.line },
            style,
          ]}
          {...props}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
};

const DrawerTitle = ({ children }: { children?: React.ReactNode }) => {
  const { titleId } = useDrawerRootContext('Title');
  const c = useNativeColors();
  const heading = useNativeHeadingFamily();
  return (
    <Text
      nativeID={titleId}
      accessibilityRole="header"
      style={[styles.title, { fontFamily: heading }, { color: c.ink }]}
    >
      {children}
    </Text>
  );
};

const DrawerDescription = ({ children }: { children?: React.ReactNode }) => {
  const { descriptionId } = useDrawerRootContext('Description');
  const c = useNativeColors();
  return (
    <Text nativeID={descriptionId} style={[styles.description, { color: c.muted }]}>
      {children}
    </Text>
  );
};

const DrawerClose = ({ children }: { children?: React.ReactNode }) => {
  const { setOpen } = useDrawerRootContext('Close');
  const c = useNativeColors();
  return (
    <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}>
      <Text style={[styles.closeLabel, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

export const Drawer = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Backdrop: DrawerBackdrop,
  Panel: DrawerPanel,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: DrawerClose,
};

// Which end of the overlay the panel sits at.
const edgeAlignment: Record<
  DrawerSide,
  { justifyContent: 'flex-start' | 'flex-end'; alignItems: 'flex-start' | 'flex-end' | 'stretch' }
> = {
  left: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  right: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  top: { justifyContent: 'flex-start', alignItems: 'stretch' },
  bottom: { justifyContent: 'flex-end', alignItems: 'stretch' },
};

// Matches the web leaf's `sideStyles`: 20rem = 320 for the side panels, 80% of
// the screen for the horizontal ones.
const edgeStyles: Record<DrawerSide, object> = {
  left: { height: '100%', width: '100%', maxWidth: 320, borderRightWidth: 1 },
  right: { height: '100%', width: '100%', maxWidth: 320, borderLeftWidth: 1 },
  top: { width: '100%', maxHeight: '80%', borderBottomWidth: 1 },
  bottom: { width: '100%', maxHeight: '80%', borderTopWidth: 1 },
};

const styles = StyleSheet.create({
  trigger: { alignSelf: 'flex-start' },
  triggerLabel: { ...textScale.base, fontWeight: '500' },
  overlay: { flex: 1 },
  panel: {
    gap: spacing.md,
    padding: spacing.lg,
    // No radius on the edges that meet the screen — a drawer is flush with the
    // side it enters from, which is what distinguishes it from a Dialog card.
    borderRadius: 0,
  },
  title: { ...textScale.lg, fontWeight: '600' },
  description: { ...textScale.sm },
  close: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  closeLabel: { ...textScale.sm, fontWeight: '500' },
});
