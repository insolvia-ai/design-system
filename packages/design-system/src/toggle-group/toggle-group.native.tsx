// NATIVE LEAF — React Native primitives. A single part, Root: a `role="group"`
// View that provides ToggleGroupContext to any `Toggle` rendered inside it.
// Per-member a11y still lives on each Toggle (`accessibilityRole` + a
// forwarded `aria-pressed` — see toggle.native.tsx's header for why); what
// lives HERE is the group's own name.
//
// `role="group"` is load-bearing, not decoration. Until 0.9.1 this was a
// roleless View, on the stated grounds that RN had no `role="group"`
// equivalent — which was wrong twice over: RN's `Role` union has included
// 'group' since the `role` prop landed, and alert-dialog.native.tsx already
// puts `role="alertdialog"` on a plain View and has react-native-web forward
// it. The cost of the mistake was real: `aria-label` on a roleless element is
// axe's `aria-prohibited-attr`, so the group could not be named at all, and
// the workbench story papered over it with a visible <Text> heading that no
// consumer of this package ever gets. The gate passed a component that would
// have failed in a consumer's app.
//
// A note on what the label does per platform. On web (react-native-web) it
// becomes a real `aria-label` on a `role="group"` element — the same contract
// the .web leaf offers. On iOS/Android a View is not an accessibility element
// unless `accessible` is set, so the label is inert there rather than wrong;
// that is RN's model for grouping containers, and it matches what the web leaf
// promises as closely as the platform allows.
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import {
  ToggleGroupContext,
  useToggleGroupState,
  type ToggleGroupRootOwnProps,
} from './toggle-group.props';

export interface ToggleGroupRootProps extends ViewProps, ToggleGroupRootOwnProps {}

const ToggleGroupRoot = ({
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  disabled = false,
  size = 'md',
  children,
  style,
  ...props
}: ToggleGroupRootProps) => {
  const ctx = useToggleGroupState(value, defaultValue, onValueChange, multiple, disabled, size);
  return (
    <ToggleGroupContext.Provider value={ctx}>
      <View role="group" style={[styles.root, style]} {...props}>
        {children}
      </View>
    </ToggleGroupContext.Provider>
  );
};

export const ToggleGroup = { Root: ToggleGroupRoot };

const styles = StyleSheet.create({
  // `alignSelf` shrink-wraps the group, as the web leaf's `inline-flex` does. A
  // React Native parent defaults to `alignItems: 'stretch'`, so without it the
  // group's box runs the full width of whatever contains it while the web one
  // ends at the last toggle — the two panes then draw a different component.
  // See chip.native.tsx for the long version.
  root: { flexDirection: 'row', alignSelf: 'flex-start', gap: spacing.xs },
});
