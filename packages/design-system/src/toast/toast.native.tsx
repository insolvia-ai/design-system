// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// The Viewport is an absolutely positioned overlay inside the app tree, NOT an
// RN Modal. A Modal would block every touch behind it for as long as a toast
// is up, and a toast is by definition not worth interrupting the app for — so
// the strip is `pointerEvents="box-none"`, which lets presses fall through
// everywhere except on a toast itself.
//
// That means placement is the consumer's: render `<Toast.Viewport />` last
// inside the root View, so it paints above the app. React Native gives every
// View its own stacking context (the reasoning field.props.ts records), so
// there is no z-index that can rescue a Viewport rendered too early.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  DEFAULT_TOAST_DISMISS_LABEL,
  DEFAULT_VIEWPORT_LABEL,
  ToastContext,
  toastRole,
  useToastList,
  useToastStore,
  type ToastIntent,
} from './toast.props';

export interface ToastProviderProps {
  children?: React.ReactNode;
}

const ToastProvider = ({ children }: ToastProviderProps) => {
  const store = useToastStore();
  return <ToastContext.Provider value={store}>{children}</ToastContext.Provider>;
};

export interface ToastViewportProps extends ViewProps {
  label?: string | undefined;
  dismissLabel?: string | undefined;
}

const ToastViewport = ({
  label = DEFAULT_VIEWPORT_LABEL,
  dismissLabel = DEFAULT_TOAST_DISMISS_LABEL,
  style,
  ...props
}: ToastViewportProps) => {
  const { toasts, api } = useToastList();
  const c = useNativeColors();

  const stripeColor: Record<ToastIntent, string> = {
    info: c.primary,
    success: c.success,
    warning: c.warning,
    danger: c.danger,
  };

  return (
    <View
      role="region"
      accessibilityLabel={label}
      pointerEvents="box-none"
      style={[styles.viewport, style]}
      {...props}
    >
      {toasts.map((toast) => (
        <View
          key={toast.id}
          // Same live-region role as the web leaf, from the same shared rule.
          role={toastRole(toast.intent)}
          style={[
            styles.toast,
            {
              borderColor: c.line,
              borderLeftColor: stripeColor[toast.intent],
              backgroundColor: c.card,
            },
          ]}
        >
          <View style={styles.body}>
            <Text style={[styles.title, { color: c.ink }]}>{toast.title}</Text>
            {toast.description === undefined ? null : (
              <Text style={[styles.description, { color: c.muted }]}>{toast.description}</Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            onPress={() => api.remove(toast.id)}
            style={styles.dismiss}
          >
            <Text style={[styles.dismissGlyph, { color: c.muted }]}>&#215;</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
};

export const Toast = {
  Provider: ToastProvider,
  Viewport: ToastViewport,
};

const styles = StyleSheet.create({
  // Mirrors the web leaf's `fixed bottom-0 right-0 w-full max-w-[24rem] p-md`:
  // the cap is on the STRIP, not on the toast, and the strip's own padding
  // eats into it. Capping the toast instead made it 384 against the web
  // leaf's 352 — measured in the workbench, both pinned to the same corner.
  viewport: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: 384,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  toast: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  body: { flex: 1, flexShrink: 1, gap: spacing.xs },
  title: { ...textScale.sm, fontWeight: '600' },
  description: { ...textScale.sm },
  dismiss: { paddingHorizontal: spacing.xs },
  dismissGlyph: { fontSize: 14, lineHeight: 14 },
});
