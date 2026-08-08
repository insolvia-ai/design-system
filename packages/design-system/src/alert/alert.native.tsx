// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colors resolve at
// render time; StyleSheet.create keeps scheme-independent layout only.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  AlertContext,
  alertRole,
  DEFAULT_DISMISS_LABEL,
  useAlertContext,
  type AlertIntent,
} from './alert.props';

export interface AlertRootProps extends ViewProps {
  intent?: AlertIntent | undefined;
  onDismiss?: (() => void) | undefined;
  dismissLabel?: string | undefined;
  children?: React.ReactNode;
}

const AlertRoot = ({
  intent = 'info',
  onDismiss,
  dismissLabel = DEFAULT_DISMISS_LABEL,
  style,
  children,
  ...props
}: AlertRootProps) => {
  const c = useNativeColors();
  const ctx = React.useMemo(
    () => ({ intent, onDismiss, dismissLabel }),
    [intent, onDismiss, dismissLabel],
  );
  const stripeColor: Record<AlertIntent, string> = {
    info: c.primary,
    success: c.success,
    warning: c.warning,
    danger: c.danger,
  };

  return (
    <AlertContext.Provider value={ctx}>
      <View
        // RN's own `role` prop, which react-native-web forwards to the DOM
        // unchanged — so both leaves put the SAME live-region role on the
        // same box. See `alertRole` for why it is not always 'alert'.
        role={alertRole(intent)}
        style={[
          styles.root,
          {
            borderColor: c.line,
            borderLeftColor: stripeColor[intent],
            backgroundColor: c.card,
          },
          style,
        ]}
        {...props}
      >
        <View style={styles.body}>{children}</View>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            onPress={onDismiss}
            style={styles.dismiss}
          >
            <Text style={[styles.dismissGlyph, { color: c.muted }]}>&#215;</Text>
          </Pressable>
        ) : null}
      </View>
    </AlertContext.Provider>
  );
};

const AlertTitle = ({ children }: { children?: React.ReactNode }) => {
  const c = useNativeColors();
  return <Text style={[styles.title, { color: c.ink }]}>{children}</Text>;
};

const AlertDescription = ({ children }: { children?: React.ReactNode }) => {
  const c = useNativeColors();
  return <Text style={[styles.description, { color: c.muted }]}>{children}</Text>;
};

const AlertClose = ({ children }: { children?: React.ReactNode }) => {
  const { onDismiss } = useAlertContext('Close');
  const c = useNativeColors();
  if (!onDismiss) return null;
  return (
    <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.close}>
      <Text style={[styles.closeLabel, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

export const Alert = {
  Root: AlertRoot,
  Title: AlertTitle,
  Description: AlertDescription,
  Close: AlertClose,
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    // Matches the web leaf's `border-l-4`.
    borderLeftWidth: 4,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  body: { flex: 1, flexShrink: 1, gap: spacing.xs },
  dismiss: { paddingHorizontal: spacing.xs },
  // Sized to the web leaf's `text-sm leading-none` × glyph.
  dismissGlyph: { fontSize: 14, lineHeight: 14 },
  title: { ...textScale.sm, fontWeight: '600' },
  description: { ...textScale.sm },
  close: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  closeLabel: { ...textScale.sm, fontWeight: '500' },
});
