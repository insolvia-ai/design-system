// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colors resolve at
// render time; StyleSheet.create holds scheme-independent layout only.
import * as React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { dotSizePx, hasDot, type BadgeIntent, type BadgeSize } from './badge.props';

export interface BadgeProps extends ViewProps {
  intent?: BadgeIntent | undefined;
  size?: BadgeSize | undefined;
  children?: React.ReactNode;
}

const sizeHeight: Record<BadgeSize, number> = { sm: 20, md: 24 };
const sizePadX: Record<BadgeSize, number> = { sm: spacing.sm, md: 10 };

export const Badge = ({
  intent = 'neutral',
  size = 'md',
  style,
  children,
  ...props
}: BadgeProps) => {
  const c = useNativeColors();
  const dotColor: Record<Exclude<BadgeIntent, 'neutral'>, string> = {
    primary: c.primary,
    success: c.success,
    warning: c.warning,
    danger: c.danger,
  };
  const dot = dotSizePx[size];

  return (
    <View
      style={[
        styles.root,
        {
          height: sizeHeight[size],
          paddingHorizontal: sizePadX[size],
          backgroundColor: c.surfaceAlt,
        },
        style,
      ]}
      {...props}
    >
      {hasDot(intent) ? (
        <View
          // Decorative, exactly as the web leaf's aria-hidden dot — nothing
          // for a screen reader to stop on.
          accessible={false}
          style={{
            width: dot,
            height: dot,
            borderRadius: radii.pill,
            backgroundColor: dotColor[intent],
          }}
        />
      ) : null}
      <Text style={[styles.label, { color: c.ink }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radii.pill,
  },
  // `textScale.xs` matches the web leaf's `text-xs` at both sizes.
  label: { ...textScale.xs, fontWeight: '500' },
});
