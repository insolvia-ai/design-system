// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Shares the
// exact selection model with the web leaf (bottom-nav.props); what is
// reimplemented here is every rendered element and the a11y surface. RN has
// no "navigation landmark" of its own, but `role="navigation"` on a `View`
// IS forwarded by react-native-web to a real DOM `role`/`aria-label` pair —
// breadcrumbs.native.tsx already leans on the identical trick for its own
// landmark, so `Root` does too, rather than leaving `label` accepted-and-
// unused the way `Link`'s web-only `external` is.
//
// Colours resolve at render time via `useNativeColors()`; `StyleSheet.create`
// holds only scheme-independent layout. There is no keyboard grammar to port
// — same as every other native leaf here — a press activates the item
// directly.
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  BottomNavRootContext,
  useBottomNavRootContext,
  useBottomNavState,
  type BottomNavItemOwnProps,
  type BottomNavRootOwnProps,
} from './bottom-nav.props';

// Material's Bottom Navigation height. Not drawn from `@insolvia-ai/tokens`'
// spacing scale (56 is not one of its steps) — it matches the web leaf's
// `min-h-14` (56px) by construction, the same bar height on both platforms.
const BAR_HEIGHT = 56;

export interface BottomNavRootProps extends Omit<ViewProps, 'children'>, BottomNavRootOwnProps {
  children?: React.ReactNode;
}

const BottomNavRoot = ({
  value,
  defaultValue,
  onValueChange,
  showLabels = 'always',
  label = 'Primary',
  fixed = false,
  insetBottom = 0,
  children,
  style,
  ...props
}: BottomNavRootProps) => {
  const ctx = useBottomNavState(value, defaultValue, onValueChange, showLabels);
  const c = useNativeColors();

  return (
    <BottomNavRootContext.Provider value={ctx}>
      <View
        role="navigation"
        accessibilityLabel={label}
        style={[
          styles.root,
          { borderTopColor: c.line, backgroundColor: c.card, paddingBottom: insetBottom },
          // `bottom`/`left`/`right` anchor to the nearest POSITIONED ancestor,
          // same as web's `fixed inset-x-0 bottom-0` anchors to the viewport —
          // a real device screen is that ancestor for an RN consumer's root
          // view. There is no RN counterpart to CSS `env()`: `insetBottom` is
          // the caller-supplied stand-in either way, fixed or not — see
          // bottom-nav.props.ts.
          fixed ? styles.fixed : null,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </BottomNavRootContext.Provider>
  );
};

export interface BottomNavItemProps
  extends
    Omit<
      PressableProps,
      'onPress' | 'disabled' | 'accessibilityLabel' | 'accessibilityState' | 'accessibilityRole'
    >,
    BottomNavItemOwnProps {}

const BottomNavItem = ({
  value,
  label,
  icon,
  disabled = false,
  style,
  // Pulled out and re-wired below, same reason toggle.native.tsx pulls these
  // out: `props` is spread LAST, so a caller's own handler left inside it
  // would replace the ring wiring outright instead of running alongside it.
  onFocus,
  onBlur,
  ...props
}: BottomNavItemProps) => {
  const { value: activeValue, setValue, showLabels } = useBottomNavRootContext('Item');
  const selected = activeValue === value;
  // Unlike the web leaf, hiding the label here means not rendering the `Text`
  // at all — `accessibilityLabel` below already supplies the accessible name
  // regardless, so there is no `sr-only` counterpart to reach for.
  const showLabel = showLabels === 'always' || selected;
  const c = useNativeColors();
  const focus = useNativeFocusRing();
  const body = useNativeBodyFamily();

  // `aria-current` is web-only and outside RN's types; react-native-web
  // forwards it to the DOM regardless — the same shape
  // breadcrumbs.native.tsx's Item uses for its own current crumb. Omitted
  // (not set to `undefined`) when this item is not selected, so an
  // unselected item carries no attribute at all.
  const webAria = (selected ? { 'aria-current': 'page' } : {}) as object;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      {...webAria}
      onPress={() => setValue(value)}
      onFocus={(event) => {
        focus.focus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.blur();
        onBlur?.(event);
      }}
      style={(pressableState) => [
        styles.item,
        focus.ringStyle,
        { opacity: disabled ? 0.5 : pressableState.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(pressableState) : style,
      ]}
      {...props}
    >
      {/* Decorative — the item's accessible name is `accessibilityLabel`
          above, never the icon. */}
      <View accessible={false}>{icon}</View>
      {showLabel ? (
        <Text style={[styles.label, { fontFamily: body, color: selected ? c.primary : c.muted }]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
};

export const BottomNav = {
  Root: BottomNavRoot,
  Item: BottomNavItem,
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: BAR_HEIGHT,
    borderTopWidth: 1,
  },
  fixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Not a claim that 40 means the same thing cross-platform — it doesn't,
    // RN's stacking context is per-parent, not global — only that a pinned
    // bar should sit above ordinary in-flow content near it, the same intent
    // the web leaf's `z-40` states for its own stacking context.
    zIndex: 40,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  label: { ...textScale.xs, fontWeight: '500' },
});
