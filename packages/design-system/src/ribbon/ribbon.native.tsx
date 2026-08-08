// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// `position: 'absolute'` in React Native resolves against the nearest ancestor
// with `position: 'relative'` — the same contract as the web leaf, so the same
// sentence on the prop applies to both. What does NOT carry across is z-order:
// every RN View starts its own stacking context (see the `controlOpen` note in
// field.props.ts), so a ribbon can only stack against its own siblings. Inside
// a card that is exactly what is wanted.
import * as React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { positionOffsets, type RibbonPosition, type RibbonTone } from './ribbon.props';

export interface RibbonProps extends ViewProps {
  tone?: RibbonTone | undefined;
  /** Pins to this corner of the nearest `position: 'relative'` ancestor. */
  position?: RibbonPosition | undefined;
  children?: React.ReactNode;
}

// The corner radii per position, matching the web leaf's `rounded-*` pairs:
// the outer corner follows the card's `lg`, the inner one softens with `md`.
const positionRadii: Record<RibbonPosition, object> = {
  'top-left': { borderTopLeftRadius: radii.lg, borderBottomRightRadius: radii.md },
  'top-right': { borderTopRightRadius: radii.lg, borderBottomLeftRadius: radii.md },
  'bottom-left': { borderBottomLeftRadius: radii.lg, borderTopRightRadius: radii.md },
  'bottom-right': { borderBottomRightRadius: radii.lg, borderTopLeftRadius: radii.md },
};

export const Ribbon = ({
  tone = 'primary',
  position = 'top-right',
  style,
  children,
  ...props
}: RibbonProps) => {
  const c = useNativeColors();
  const background = tone === 'primary' ? c.primary : c.surfaceAlt;
  const foreground = tone === 'primary' ? c.primaryText : c.ink;

  return (
    <View
      style={[
        styles.root,
        positionOffsets[position],
        positionRadii[position],
        { backgroundColor: background },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.label, { color: foreground }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: { ...textScale.xs, fontWeight: '600' },
});
