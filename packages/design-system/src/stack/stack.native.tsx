// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Layout only (no
// colour), so there is no render-time resolution to do here — unlike
// `useNativeColors()`, `spacing` does not follow the OS colour scheme, and a
// `StyleSheet`-held number is exactly as themeable as a `dp` value needs to
// be. This is also WHY the gap map lives here and not in `stack.props.ts`:
// the shared module stays renderer-free (no `*.props.ts` in this package
// imports `@insolvia-ai/tokens`), so the map that turns a gap NAME into a
// platform-specific VALUE is a per-leaf concern, one map per unit system.
//
// Block-level on web means "declare nothing" here too: a `View` with no
// `width`/`alignSelf` already stretches to fill its parent, which is RN's own
// default and matches the web leaf's block-level `<div>`.
import * as React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import {
  withDividers,
  type StackAlign,
  type StackDirection,
  type StackGap,
  type StackJustify,
} from './stack.props';

export interface StackProps extends ViewProps {
  /** Flex-direction. Defaults to `'column'`. */
  direction?: StackDirection | undefined;
  /** Spacing token between children. Defaults to `'md'`. */
  gap?: StackGap | undefined;
  /** Cross-axis alignment (`alignItems`). Defaults to `'stretch'`. */
  align?: StackAlign | undefined;
  /** Main-axis alignment (`justifyContent`). Defaults to `'start'`. */
  justify?: StackJustify | undefined;
  /** Allow children to wrap onto additional lines. Defaults to `false`. */
  wrap?: boolean | undefined;
  /**
   * Rendered between every pair of children — pass a `Separator`-like
   * element. Stack does not import `Separator` itself; see the web leaf for
   * why.
   */
  divider?: React.ReactNode;
  children?: React.ReactNode;
}

/** `none` → 0, the same "no gap" reading `gap-0` gives the web leaf. */
const gapValue: Record<StackGap, number> = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
};

const alignItems: Record<StackAlign, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const justifyContent: Record<StackJustify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
};

export function Stack({
  direction = 'column',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  divider,
  style,
  children,
  ...props
}: StackProps) {
  return (
    <View
      style={[
        styles.root,
        {
          flexDirection: direction === 'row' ? 'row' : 'column',
          gap: gapValue[gap],
          alignItems: alignItems[align],
          justifyContent: justifyContent[justify],
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...props}
    >
      {divider ? withDividers(children, divider) : children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { display: 'flex' },
});
