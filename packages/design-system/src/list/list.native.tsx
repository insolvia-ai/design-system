// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colors resolve at
// render time; StyleSheet.create holds scheme-independent layout only.
//
// A row is a `Pressable` only when it has somewhere to go — `onPress`, or
// `href` opened through `Linking.openURL` (this package knows nothing about
// routers; see `link.props.ts`'s header for the same rule stated once,
// properly). Otherwise it is a plain `View`: RN has no keyboard to reach a row
// with no handler, so there is nothing a `Pressable` would add.
import * as React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  DIVIDER_INSET_PX,
  ListRootContext,
  ROW_HEIGHT,
  SLOT_SIZE,
  useListRowContext,
  type ListItemOwnProps,
} from './list.props';

export interface ListRootProps extends ViewProps {
  dense?: boolean | undefined;
  inset?: boolean | undefined;
  children?: React.ReactNode;
}

const ListRoot = ({ dense = false, inset = false, style, children, ...props }: ListRootProps) => {
  const ctx = React.useMemo(() => ({ dense, inset }), [dense, inset]);
  return (
    <ListRootContext.Provider value={ctx}>
      <View accessibilityRole="list" style={[styles.root, style]} {...props}>
        {children}
      </View>
    </ListRootContext.Provider>
  );
};

export interface ListItemProps extends ListItemOwnProps {
  /** Fires on press. Does nothing when `disabled`. */
  onPress?: (() => void) | undefined;
  /** Opened via `Linking.openURL` after `onPress`, on the same press. */
  href?: string | undefined;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const ListItem = ({
  selected = false,
  disabled = false,
  onPress,
  href,
  style,
  children,
}: ListItemProps) => {
  const { dense, inset } = useListRowContext();
  const c = useNativeColors();
  // `focusRing` even though a touch device has no keyboard focus to ring: an
  // RN app can still be driven by a hardware keyboard, a switch control, or
  // (this being react-native-web) an actual browser tab key — the same
  // reasoning every other pressable leaf in this package already applies.
  const focus = useNativeFocusRing();
  const interactive = onPress !== undefined || href !== undefined;

  const rowStyle: StyleProp<ViewStyle> = [
    styles.row,
    {
      minHeight: dense ? ROW_HEIGHT.dense : ROW_HEIGHT.normal,
      paddingLeft: inset ? spacing.xl : spacing.md,
      paddingRight: spacing.md,
    },
    selected ? { backgroundColor: c.surfaceAlt } : null,
  ];

  // Every direct child of `Root`'s `accessibilityRole="list"` View must
  // itself register as a `listitem` — axe's `list` rule
  // (`aria-required-children`), which react-native-web's DOM translation
  // fails on its own: a Pressable renders `role="button"` and a plain View
  // renders whatever `accessibilityRole` it carries (`"none"` below), neither
  // of which is `listitem`. The wrapper costs nothing on a device (no such
  // check exists there) and nothing visually — an unstyled `View` inherits
  // `Root`'s default `alignItems: 'stretch'`, so the row still fills `Root`'s
  // width exactly as it did unwrapped.
  if (!interactive) {
    return (
      <View role="listitem">
        <View accessibilityRole="none" style={[rowStyle, disabled && styles.disabled, style]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View role="listitem">
      <Pressable
        accessibilityRole="button"
        // `accessibilityState` for the real native platforms — react-native-
        // web's DOM translation does NOT flatten it into an `aria-*`
        // attribute on its own (`disabled` is the one exception, derived
        // automatically, so it needs nothing extra below). It used to be
        // paired with an explicit `aria-selected`, but that is invalid here:
        // this Pressable renders `role="button"`, and ARIA restricts
        // `aria-selected` to `option`/`row`/`gridcell`/`tab`/etc, none of
        // which a button is (axe's `aria-allowed-attr`). `aria-current` has
        // no such restriction, so it carries the same signal instead: "page"
        // when this row is a destination (`href`, mirroring the web leaf's
        // own `aria-current="page"`), else the generic "true" for a plain
        // selected row.
        accessibilityState={{ selected, disabled }}
        aria-current={
          href !== undefined ? (selected ? 'page' : undefined) : selected ? 'true' : undefined
        }
        disabled={disabled}
        onFocus={focus.focus}
        onBlur={focus.blur}
        onPress={
          disabled
            ? undefined
            : () => {
                onPress?.();
                if (href !== undefined) Linking.openURL(href);
              }
        }
        style={[rowStyle, focus.ringStyle, style]}
      >
        {children}
      </Pressable>
    </View>
  );
};

const ListLeading = ({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) => {
  const c = useNativeColors();
  return (
    // Decorative by default, matching the web leaf's `aria-hidden` — see the
    // JSDoc on `ListLeading` there for what a meaningful icon should do
    // instead (nothing this leaf can enforce).
    <View accessible={false} style={[styles.slot, style]}>
      {/* A string here is a glyph in a fixed slot, not body copy — no body family. */}
      {typeof children === 'string' ? <Text style={{ color: c.muted }}>{children}</Text> : children}
    </View>
  );
};

const ListTrailing = ({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) => (
  // NOT wrapped in `accessible={false}` — a Switch or Badge living here stays
  // individually reachable, matching the web leaf's non-decorative Trailing.
  <View style={[styles.trailing, style]}>{children}</View>
);

export interface ListTextProps {
  primary: React.ReactNode;
  secondary?: React.ReactNode | undefined;
}

// `ListTextPart`, not `Text` — this is `List.Text`, distinct from the RN
// `Text` imported above and from this package's own `Text` component, which
// this leaf never imports (see the web leaf's header note on the same name).
const ListTextPart = ({ primary, secondary }: ListTextProps) => {
  const c = useNativeColors();
  const body = useNativeBodyFamily();
  return (
    <View style={styles.textWrap}>
      <Text numberOfLines={1} style={[textScale.sm, { fontFamily: body, color: c.ink }]}>
        {primary}
      </Text>
      {secondary !== undefined ? (
        <Text numberOfLines={1} style={[textScale.xs, { fontFamily: body, color: c.muted }]}>
          {secondary}
        </Text>
      ) : null}
    </View>
  );
};

const ListSubheader = ({ style, children, ...props }: TextProps) => {
  const c = useNativeColors();
  // A section label in small caps, not a display heading — it follows the
  // body family, the way Sidebar's section titles and Table's header cells do.
  const body = useNativeBodyFamily();
  return (
    // See `ListItem`'s comment above — every direct child of `Root` needs
    // the same `listitem` wrapper, headings included.
    <View role="listitem">
      <Text
        accessibilityRole="header"
        style={[styles.subheader, { fontFamily: body, color: c.muted }, style]}
        {...props}
      >
        {children}
      </Text>
    </View>
  );
};

export interface ListDividerProps extends ViewProps {
  inset?: boolean | undefined;
}

const ListDivider = ({ inset = false, style, ...props }: ListDividerProps) => {
  const c = useNativeColors();
  return (
    // Same `listitem` wrapper as `ListItem`/`ListSubheader` above — the rule
    // line itself keeps `role="separator"` (RN's newer `role` prop supports
    // it directly, unlike the legacy `accessibilityRole` union) one level
    // down, inside the wrapper rather than on it.
    <View role="listitem">
      <View
        role="separator"
        style={[styles.divider, inset && styles.dividerInset, { backgroundColor: c.line }, style]}
        {...props}
      />
    </View>
  );
};

export const List = {
  Root: ListRoot,
  Item: ListItem,
  Leading: ListLeading,
  Trailing: ListTrailing,
  Text: ListTextPart,
  Subheader: ListSubheader,
  Divider: ListDivider,
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  disabled: { opacity: 0.5 },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailing: { marginLeft: 'auto', flexShrink: 0, flexDirection: 'row', alignItems: 'center' },
  textWrap: { flex: 1, minWidth: 0 },
  subheader: {
    ...textScale.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: { height: 1, marginVertical: spacing.xs },
  dividerInset: { marginLeft: DIVIDER_INSET_PX },
});
