// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Metro resolves
// this. Mirrors button.native.tsx's shape; what it adds is the accessible name
// (always) and the toggle state (only when asked for).
import * as React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import type { IconButtonIntent, IconButtonOwnProps, IconButtonSize } from './icon-button.props';

// `children` is Omit-ed because PressableProps types it as a render function
// as well as a node, and this component puts its child inside a <Text> — a
// function child would be handed the press state and never rendered. The
// name props are Omit-ed for the same reason the web leaf omits `aria-label`:
// `label` owns the accessible name outright.
export interface IconButtonProps
  extends
    Omit<PressableProps, 'children' | 'accessibilityLabel' | 'aria-label'>,
    IconButtonOwnProps {}

const sizeBox: Record<IconButtonSize, number> = { sm: 32, md: 44 };

/**
 * The 44dp hit area, in this platform's dialect.
 *
 * The web leaf grows a centred `::after` under `@media (pointer: coarse)`;
 * RN has `hitSlop`, which does the same job directly — it extends the touch
 * area without touching layout or paint. 6dp on each side takes `sm`'s 32 to
 * 44. There is no pointer query because there is no pointer to query: a
 * React Native surface is a touchscreen.
 *
 * `md` is 44 already, so it gets none — the same reason the web leaf applies
 * its overlay to `sm` alone.
 */
const sizeHitSlop: Record<IconButtonSize, number> = { sm: 6, md: 0 };

// Font size WITHOUT a line height, unlike button.native.tsx's label. This is a
// glyph pinned inside a fixed square, which is the case native-typography.ts
// carves out by name (the Checkbox tick, the Select chevron, the Avatar
// fallback): a taller line box would fight the box rather than the text around
// it, because there is no text around it.
const iconText: Record<IconButtonSize, number> = { sm: 14, md: 16 };

export function IconButton({
  label,
  intent = 'ghost',
  size = 'md',
  pressed,
  children,
  disabled,
  style,
  // PULLED OUT OF `props` ON PURPOSE. `props` is spread LAST below, so a
  // caller's own handler left in there would replace the ring wiring outright
  // rather than run alongside it.
  onFocus,
  onBlur,
  ...props
}: IconButtonProps) {
  // Colors resolve per render so the leaf follows the OS scheme; only the
  // scheme-independent maps and layout live at module level.
  const c = useNativeColors();
  const r = useNativeRadii();
  // This package's ring rather than the browser's default blue one, which is
  // what react-native-web paints on an unringed Pressable — see
  // lib/native-focus.native.ts. An icon button is the control most likely to be
  // reached by keyboard alone, and it was showing Chrome's ring.
  const focus = useNativeFocusRing();
  const intentBg: Record<IconButtonIntent, string> = {
    primary: c.primary,
    secondary: c.surfaceAlt,
    ghost: 'transparent',
    danger: c.danger,
    // Nothing at rest — the glyph and the media, and no box between them.
    overlay: 'transparent',
  };
  const intentFg: Record<IconButtonIntent, string> = {
    primary: c.primaryText,
    secondary: c.ink,
    ghost: c.ink,
    // `dangerText` rather than `primaryText`. The two hold identical values, so
    // no pixel moves; what changes is that a brand overriding its primary
    // foreground no longer silently moves the glyph on its danger fill.
    danger: c.dangerText,
    overlay: c.overlayInk,
  };
  const pressedBg: Record<IconButtonIntent, string> = {
    primary: c.primaryActive,
    secondary: c.line,
    ghost: c.line,
    danger: c.dangerHover,
    overlay: c.overlayActive,
  };

  // Pressed is reported BOTH ways, the split toggle.native.tsx measured against
  // this repo's pinned react-native-web: `accessibilityState` for the real
  // native platforms, and `aria-pressed` — which has no react-native type at
  // all, hence the contained cast — for react-native-web, whose DOM prop
  // translation does not flatten `accessibilityState` into any `aria-*`
  // attribute. Spread only when `pressed` was given, so a one-shot button
  // announces no toggle it does not have.
  const toggleProps = (
    pressed === undefined
      ? {}
      : { accessibilityState: { selected: pressed }, 'aria-pressed': pressed }
  ) as PressableProps;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={sizeHitSlop[size]}
      {...toggleProps}
      disabled={disabled ?? undefined}
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
          width: sizeBox[size],
          height: sizeBox[size],
          backgroundColor: pressed === true ? pressedBg[intent] : intentBg[intent],
          opacity: disabled ? 0.5 : state.pressed ? 0.9 : 1,
        },
        focus.ringStyle,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {/* The icon rides inside a <Text> for the same reason Button's label
          does: it is the only RN primitive that passes a colour down. An icon
          FONT glyph inherits `color` from here; a react-native-svg icon names
          its own colour and is unaffected, which is the caller's call to make
          — this package ships no icons. */}
      <Text style={[styles.icon, { fontSize: iconText[size], color: intentFg[intent] }]}>
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
  },
  icon: {
    textAlign: 'center',
  },
});
