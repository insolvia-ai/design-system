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

import { spacing, type Radii } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
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
//
// A FUNCTION of the resolved radii rather than a module-level constant: the
// values reach this from `useNativeRadii()` at render time, so a
// `ThemeProvider` can move them. Built at module load it would be frozen at the
// token defaults, which is the whole bug this seam closes.
const positionRadii = (r: Radii): Record<RibbonPosition, object> => ({
  'top-left': { borderTopLeftRadius: r.lg, borderBottomRightRadius: r.md },
  'top-right': { borderTopRightRadius: r.lg, borderBottomLeftRadius: r.md },
  'bottom-left': { borderBottomLeftRadius: r.lg, borderTopRightRadius: r.md },
  'bottom-right': { borderBottomRightRadius: r.lg, borderTopLeftRadius: r.md },
});

export const Ribbon = ({
  tone = 'primary',
  position = 'top-right',
  style,
  children,
  ...props
}: RibbonProps) => {
  const c = useNativeColors();
  const r = useNativeRadii();
  const background = tone === 'primary' ? c.primary : c.surfaceAlt;
  const foreground = tone === 'primary' ? c.primaryText : c.ink;

  return (
    <View
      style={[
        styles.root,
        positionOffsets[position],
        positionRadii(r)[position],
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
