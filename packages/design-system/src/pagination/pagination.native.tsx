// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colours, radii and
// the focus ring resolve at render time inside each Pressable;
// `StyleSheet.create` holds only scheme-independent layout — the 0.2.1 rule
// applies here as much as anywhere.
//
// The web leaf's `<nav><ul>` has no RN counterpart: the landmark is a plain
// View with `accessibilityRole="none"` (RN ships no "navigation" role) and
// `accessibilityLabel` naming it exactly as the web leaf's `aria-label`
// does. Each item is its own Pressable in a wrapping row.
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
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  FIRST_LABEL,
  LAST_LABEL,
  NEXT_LABEL,
  PREV_LABEL,
  pageLabel,
  sizeBox,
  sizeHitSlop,
  usePaginationState,
  type PaginationOwnProps,
  type PaginationSize,
} from './pagination.props';

export interface PaginationProps extends ViewProps, PaginationOwnProps {}

export function Pagination({
  count,
  page,
  defaultPage,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstLast = false,
  size = 'md',
  disabled = false,
  label = 'Pagination',
  style,
  ...props
}: PaginationProps) {
  const state = usePaginationState({
    count,
    page,
    defaultPage,
    onPageChange,
    siblingCount,
    boundaryCount,
  });

  // Out-of-range is the only guard needed: Previous/Next/First/Last are the
  // sole callers that can ask for one, since every page button's own value is
  // already inside [1, count] by construction of `paginationItems`.
  const go = (next: number) => {
    if (next < 1 || next > count) return;
    state.setPage(next);
  };

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel={label}
      style={[styles.root, style]}
      {...props}
    >
      {showFirstLast ? (
        <NavButton
          glyph="«"
          label={FIRST_LABEL}
          size={size}
          disabled={disabled || state.page <= 1}
          onPress={() => go(1)}
        />
      ) : null}
      <NavButton
        glyph="‹"
        label={PREV_LABEL}
        size={size}
        disabled={disabled || state.page <= 1}
        onPress={() => go(state.page - 1)}
      />
      {state.items.map((item) =>
        item.type === 'ellipsis' ? (
          <Ellipsis key={item.key} size={size} />
        ) : (
          <PageButton
            key={item.page}
            page={item.page}
            active={item.page === state.page}
            size={size}
            disabled={disabled}
            onPress={() => go(item.page)}
          />
        ),
      )}
      <NavButton
        glyph="›"
        label={NEXT_LABEL}
        size={size}
        disabled={disabled || state.page >= count}
        onPress={() => go(state.page + 1)}
      />
      {showFirstLast ? (
        <NavButton
          glyph="»"
          label={LAST_LABEL}
          size={size}
          disabled={disabled || state.page >= count}
          onPress={() => go(count)}
        />
      ) : null}
    </View>
  );
}

interface PageButtonProps {
  page: number;
  active: boolean;
  size: PaginationSize;
  disabled: boolean;
  onPress: () => void;
}

/**
 * A page number. `accessibilityState.selected` is what real iOS/Android
 * accessibility reads; `aria-current` is set alongside it for
 * react-native-web, which — same gap `tabs.native.tsx`'s `Tab` documents —
 * does not unpack `accessibilityState` into any `aria-*` attribute at all.
 */
function PageButton({ page, active, size, disabled, onPress }: PageButtonProps) {
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const body = useNativeBodyFamily();
  const box = sizeBox[size];
  // Cast for the same reason icon-button.native.tsx casts its toggle props:
  // core React Native's PressableProps type has no `aria-current`.
  const currentProps = (active ? { 'aria-current': 'page' } : {}) as PressableProps;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pageLabel(page, active)}
      accessibilityState={{ selected: active, disabled }}
      {...currentProps}
      hitSlop={sizeHitSlop[size]}
      disabled={disabled}
      onFocus={focus.focus}
      onBlur={focus.blur}
      onPress={onPress}
      style={(pressState) => [
        styles.item,
        { width: box, height: box, borderRadius: r.md },
        active
          ? { backgroundColor: c.primary }
          : pressState.pressed
            ? { backgroundColor: c.surfaceAlt }
            : null,
        { opacity: disabled ? 0.5 : 1 },
        focus.ringStyle,
      ]}
    >
      <Text
        style={[
          textScale.sm,
          styles.label,
          { fontFamily: body },
          { color: active ? c.primaryText : c.ink },
        ]}
      >
        {page}
      </Text>
    </Pressable>
  );
}

interface NavButtonProps {
  glyph: string;
  label: string;
  size: PaginationSize;
  disabled: boolean;
  onPress: () => void;
}

/** Previous/Next/First/Last — a glyph, never a number, so no `aria-current`
 * and no body family either: «‹›» sit in a fixed box, not in body copy, and
 * keep the platform face when a ThemeProvider names one. */
function NavButton({ glyph, label, size, disabled, onPress }: NavButtonProps) {
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const box = sizeBox[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={sizeHitSlop[size]}
      disabled={disabled}
      onFocus={focus.focus}
      onBlur={focus.blur}
      onPress={onPress}
      style={(pressState) => [
        styles.item,
        { width: box, height: box, borderRadius: r.md },
        !disabled && pressState.pressed ? { backgroundColor: c.surfaceAlt } : null,
        { opacity: disabled ? 0.5 : 1 },
        focus.ringStyle,
      ]}
    >
      <Text style={[textScale.sm, styles.label, { color: c.ink }]}>{glyph}</Text>
    </Pressable>
  );
}

/** Decorative, exactly as the web leaf's `aria-hidden` `<li>`. A glyph in a
 * fixed box, so no body family — same carve-out as the nav buttons. */
function Ellipsis({ size }: { size: PaginationSize }) {
  const c = useNativeColors();
  const box = sizeBox[size];

  return (
    <View accessible={false} style={[styles.item, { width: box, height: box }]}>
      <Text style={[textScale.sm, styles.label, { color: c.muted }]}>…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    // Shrink-wrap, as the web leaf's `inline-flex` already does — see
    // button.native.tsx's `styles.base` for the full reasoning: an RN parent
    // defaults to `alignItems: 'stretch'`, so a leaf that declares nothing
    // here would run the full width of its parent instead of hugging its
    // items.
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '500',
  },
});
