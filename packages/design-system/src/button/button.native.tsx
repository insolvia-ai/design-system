// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Metro resolves
// this. It imports `react-native`, which is exactly why the web build must never
// pick a .native leaf: this file is the falsification probe for the bundle grep.
import * as React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import type { ButtonIntent, ButtonSize } from './button.props';

export interface ButtonProps extends PressableProps {
  intent?: ButtonIntent;
  size?: ButtonSize;
  /**
   * Let a sentence-length label wrap onto more than one line, growing the
   * button downwards. RN's Text already wraps; what stops it here is the fixed
   * `height`, which this trades for the same number as `minHeight` plus the
   * vertical padding the fixed height was standing in for — the web leaf's
   * `wrapSizeStyles` in this leaf's dialect, and the same no-op for a
   * one-line label.
   */
  wrap?: boolean;
  children?: React.ReactNode;
}

const sizeHeight: Record<ButtonSize, number> = { sm: 32, md: 44, lg: 48 };
const sizePadX: Record<ButtonSize, number> = { sm: spacing.md, md: spacing.md, lg: spacing.lg };
// Only when `wrap` is on. The web leaf's `py-1.5`/`py-2`/`py-2.5` are 6/8/10px;
// `spacing.sm` is 8, and the two ends round to the nearest step on the 4pt grid
// rather than inventing three numbers off it.
const sizePadY: Record<ButtonSize, number> = { sm: spacing.xs, md: spacing.sm, lg: spacing.sm };
// Size AND line height, so the label block matches `text-sm`/`text-base` on
// the web leaf rather than react-native-web's `line-height: normal`.
const sizeText = { sm: textScale.sm, md: textScale.sm, lg: textScale.base } satisfies Record<
  ButtonSize,
  { fontSize: number; lineHeight: number }
>;

export function Button({
  intent = 'primary',
  size = 'md',
  wrap = false,
  children,
  disabled,
  style,
  // PULLED OUT OF `props` ON PURPOSE. `props` is spread LAST below, so a
  // caller's own handler left in there would replace the ring wiring outright
  // rather than run alongside it — the ring would work until the first caller
  // who wanted a focus callback, and then silently stop.
  onFocus,
  onBlur,
  ...props
}: ButtonProps) {
  // Colors resolve per render so the leaf follows the OS scheme; only the
  // scheme-independent maps and layout live at module level.
  const c = useNativeColors();
  // Without this a focused Button falls through to the BROWSER's default focus
  // ring under react-native-web — blue, hard against the control — while the
  // web leaf draws this package's own. The migration that introduced
  // lib/native-focus.native.ts reached the text inputs and stopped there,
  // leaving every Pressable in the package showing Chrome's ring.
  const focus = useNativeFocusRing();
  const intentBg: Record<ButtonIntent, string> = {
    primary: c.primary,
    secondary: c.surfaceAlt,
    ghost: 'transparent',
    danger: c.danger,
  };
  const intentText: Record<ButtonIntent, string> = {
    primary: c.primaryText,
    secondary: c.ink,
    ghost: c.ink,
    // `dangerText`, not `ink` and not a literal white: the fill flips with the
    // scheme, so the foreground on it has to as well. button.props.ts has the
    // measured rows.
    danger: c.dangerText,
  };

  return (
    <Pressable
      accessibilityRole="button"
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
        {
          // `minHeight` when wrapping, so the box can grow past the row height
          // instead of clipping the second line — the same trade the web leaf
          // makes between `h-*` and `min-h-*`.
          ...(wrap
            ? { minHeight: sizeHeight[size], paddingVertical: sizePadY[size] }
            : { height: sizeHeight[size] }),
          paddingHorizontal: sizePadX[size],
          backgroundColor: intentBg[intent],
          opacity: disabled ? 0.5 : state.pressed ? 0.9 : 1,
        },
        focus.ringStyle,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          sizeText[size],
          // Only when wrapping. RN's Text wraps on its own, but as the single
          // child of a `flexDirection: 'row'` box it will not SHRINK to a width
          // that forces a break — it overflows sideways instead, which is the
          // native spelling of the horizontal scrollbar this option exists to
          // stop. Applying it unconditionally would let every existing button's
          // label start wrapping inside a fixed height, and clip.
          wrap ? styles.labelWrapped : null,
          { color: intentText[intent] },
        ]}
      >
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
    // Shrink-wrap, as the web leaf's `inline-flex` already does. A React Native
    // parent defaults to `alignItems: 'stretch'`, so without this a Button in an
    // ordinary column View runs the full width while the same markup on web hugs
    // its label — and a size the two leaves disagree about is the one thing this
    // package claims never happens. Badge, Chip and Calendar declare the same
    // thing; IconButton reaches it through a definite width instead.
    alignSelf: 'flex-start',
    borderRadius: radii.md,
  },
  label: {
    fontWeight: '500',
  },
  labelWrapped: {
    flexShrink: 1,
    // The box is centred by `justifyContent`; this centres the RAGGED LINES
    // inside it, which is what the web leaf gets from inheriting `text-center`
    // through the same centring.
    textAlign: 'center',
  },
});
