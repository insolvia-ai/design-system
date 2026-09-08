// NATIVE LEAF — RN's Modal, exactly as Dialog's and Drawer's native leaves use
// it (dialog.native.tsx, drawer.native.tsx): portal-like hosting plus
// hardware dismissal (`onRequestClose` — the Android back button, which
// react-native-web maps to Escape) for free. This deliberately matches THEIR
// mechanism rather than the `OverlayPortal` escape hatch in
// `../lib/overlay-portal` — that one exists for the anchored, trigger-relative
// overlays (Select's list, DateInput's picker) that skip Modal on purpose to
// keep focus on the trigger. Backdrop has no trigger and no anchor, so there
// is nothing for it to keep focus on, and using anything but Modal would let
// it stack differently from the Dialog/Drawer surfaces it is meant to sit
// alongside — `overlay-portal.native.ts`'s own header notes that a
// Modal-based overlay always mounts above an OverlayPortal one.
//
// Colors resolve from `useNativeColors()` at render time; `StyleSheet.create`
// keeps scheme-independent layout only.
import * as React from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useNativeColors } from '../lib/native-theme';
import type { BackdropOwnProps } from './backdrop.props';

export interface BackdropProps extends BackdropOwnProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Backdrop({ open, onDismiss, invisible = false, children, style }: BackdropProps) {
  const c = useNativeColors();

  return (
    <Modal
      transparent
      visible={open}
      onRequestClose={() => onDismiss?.()}
      // react-native-web's ModalContent renders its own container as
      // `role={active ? 'dialog' : null}` / `aria-modal` AFTER spreading the
      // props it is given, so neither can be overridden from here — but a
      // label passed in still lands, and without one the browser sees an
      // UNNAMED `role="dialog"`, which is axe's `aria-dialog-name` (the exact
      // 0.8.3 alert-dialog regression: see that leaf's header). Dialog and
      // Drawer avoid it because they always have a Title to point at; Backdrop
      // has no title part at all, so this is a fixed label rather than a
      // conditional one.
      aria-label="Overlay"
    >
      <View
        // `testID` (RNW: `data-testid`) rather than a role, because this View
        // carries no accessible role of its own to query by — the Pressable
        // below is the one with a name, and this is the layer the scrim COLOR
        // actually lives on. Internal-only, same idea as the web leaf's
        // `data-state` hook, just RN's own mechanism for it.
        testID="backdrop-scrim"
        style={[
          styles.overlay,
          { backgroundColor: invisible ? 'transparent' : c.overlayScrim },
          style,
        ]}
      >
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
          />
        ) : (
          // Decorative and untouchable-by-name: it still captures/blocks
          // touches (RN's default `pointerEvents="auto"`), it just has no
          // press handler and nothing for a screen reader to stop on.
          <View accessible={false} style={StyleSheet.absoluteFill} />
        )}
        {children !== undefined ? (
          // A sibling of the Pressable above, not a descendant — RN's touch
          // responder system hit-tests the view TREE, so a touch landing on
          // this view's bounds never reaches the Pressable behind it. No
          // `stopPropagation` equivalent needed, unlike the web leaf.
          <View style={styles.content}>{children}</View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {},
});
