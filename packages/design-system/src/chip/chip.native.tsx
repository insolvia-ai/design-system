// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Metro resolves
// this. Mirrors icon-button.native.tsx's shape: a Pressable whose colours
// resolve per render, and a pressed state reported both ways.
import * as React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import type { ChipSize } from './chip.props';

// `children` is Omit-ed because PressableProps types it as a render function
// as well as a node, and this component puts its child inside a <Text> — a
// function child would be handed the press state and never rendered.
export interface ChipProps extends Omit<PressableProps, 'children'> {
  /** Pressed state. Omit entirely for a chip that is not a selection. */
  pressed?: boolean | undefined;
  size?: ChipSize | undefined;
  children?: React.ReactNode;
}

// `chipSizeStyles` in this leaf's dialect — the same 32/44 heights, and the
// same reason: a chip row and the controls beside it share one height scale.
const sizeHeight: Record<ChipSize, number> = { sm: 32, md: 44 };
const sizePadX: Record<ChipSize, number> = { sm: spacing.sm, md: spacing.md };

/**
 * The 44dp hit area for the size that is under it, as everywhere else in this
 * package: `hitSlop` grows the touch area without touching layout or paint,
 * and there is no pointer query because a React Native surface is a
 * touchscreen. Vertical only — a chip is already wider than 44.
 */
const sizeHitSlop: Record<ChipSize, { top: number; bottom: number }> = {
  sm: { top: 6, bottom: 6 },
  md: { top: 0, bottom: 0 },
};

export function Chip({
  pressed,
  size = 'md',
  children,
  disabled,
  style,
  // PULLED OUT OF `props` ON PURPOSE. `props` is spread LAST below, so a
  // caller's own handler left in there would replace the ring wiring outright
  // rather than run alongside it.
  onFocus,
  onBlur,
  ...props
}: ChipProps) {
  // Colors resolve per render so the leaf follows the OS scheme; only the
  // scheme-independent layout lives at module level in StyleSheet.create.
  const c = useNativeColors();
  const r = useNativeRadii();
  // This package's ring rather than the browser's default blue one, which is
  // what react-native-web paints on an unringed Pressable — see
  // lib/native-focus.native.ts. A chip ROW is tabbed through end to end, so the
  // wrong ring showed up here more often than anywhere else.
  const focus = useNativeFocusRing();

  // Reported BOTH ways, the split toggle.native.tsx and icon-button.native.tsx
  // document: `accessibilityState` for the real native platforms, and
  // `aria-pressed` — which has no react-native type, hence the contained cast —
  // for react-native-web, whose DOM prop translation does not flatten
  // `accessibilityState` into any `aria-*` attribute. Spread only when
  // `pressed` was given, so a chip that is not a selection announces no toggle.
  const toggleProps = (
    pressed === undefined
      ? {}
      : { accessibilityState: { selected: pressed }, 'aria-pressed': pressed }
  ) as PressableProps;

  return (
    <Pressable
      accessibilityRole="button"
      {...toggleProps}
      disabled={disabled ?? undefined}
      hitSlop={sizeHitSlop[size]}
      onFocus={(event) => {
        focus.focus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.blur();
        onBlur?.(event);
      }}
      style={(state) => [
        styles.base,
        { borderRadius: r.md },
        {
          height: sizeHeight[size],
          paddingHorizontal: sizePadX[size],
          // Both states carry a border and only its colour moves, so the box
          // never changes size as it is pressed — chip.props.ts has the why.
          borderColor: pressed === true ? c.primary : c.line,
          backgroundColor: pressed === true ? c.primary : 'transparent',
          opacity: disabled ? 0.5 : state.pressed ? 0.9 : 1,
        },
        focus.ringStyle,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, { color: pressed === true ? c.primaryText : c.muted }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Shrink-wrap, as the web leaf's `inline-flex shrink-0` already does. A
    // React Native parent defaults to `alignItems: 'stretch'`, so without this
    // a chip dropped into an ordinary column View runs edge to edge while the
    // same markup on web hugs its label — and a chip row is the whole point of
    // the component. Badge and Calendar declare the same thing for the same
    // reason; IconButton gets it from a definite width instead.
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  label: { ...textScale.sm, fontWeight: '500' },
});
