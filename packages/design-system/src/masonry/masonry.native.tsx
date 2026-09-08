// NATIVE LEAF — RN primitives. `columns` `View`s in a row, each `flex: 1`,
// filled from the same `distribute` function the web leaf uses — see
// masonry.props.ts for why that shared function exists at all (in short:
// round-robin is this leaf's natural port, CSS multi-column is the web leaf's,
// and the two disagree on order, so neither leaf gets to decide alone).
//
// Gap is the one value this leaf reads from `@insolvia-ai/tokens` directly
// rather than through a hook: spacing has no `ThemeProvider` override seam
// (only colors, radii and fonts do — see native-theme.native.ts), so there is
// nothing render-time about it and a plain lookup table is enough.
//
// Block-level: the web leaf declares nothing and stretches to its parent's
// width, so this leaf does too — no `alignSelf`, matching CLAUDE.md's size
// rule for block/flex-level leaves. The outer `View`'s `flexDirection: 'row'`
// already stretches to the stage's full width under the workbench's
// `alignItems: 'stretch'` native stage, which is what a consumer's root
// `View` gives its children too.
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { distribute, type MasonryGap } from './masonry.props';

export interface MasonryProps extends ViewProps {
  /** Number of columns to distribute children into. Defaults to `3`, clamped to a minimum of `1`. */
  columns?: number | undefined;
  /** Spacing token between columns and between items within a column. Defaults to `'sm'`. */
  gap?: MasonryGap | undefined;
  /**
   * Column-major distribution instead of the default round-robin. See
   * `distribute` in `masonry.props.ts` for the exact ordering either mode
   * produces. Defaults to `false`.
   */
  sequential?: boolean | undefined;
  /**
   * Items to distribute. `null`/`undefined`/`boolean` children are skipped
   * rather than reserving an empty column slot.
   */
  children?: React.ReactNode;
}

const gapValue: Record<MasonryGap, number> = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

export const Masonry = ({
  columns = 3,
  gap = 'sm',
  sequential = false,
  style,
  children,
  ...props
}: MasonryProps) => {
  const groups = distribute(children, columns, sequential);
  const g = gapValue[gap];

  return (
    <View style={[styles.root, { gap: g }, style]} {...props}>
      {groups.map((items, i) => (
        <View key={i} style={[styles.column, { gap: g }]}>
          {items}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1, flexDirection: 'column' },
});
