// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Metro resolves
// this. It imports `react-native`, which is exactly why the web build must never
// pick a .native leaf: this file is the falsification probe for the bundle grep.
import * as React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import type { ButtonIntent, ButtonSize } from './button.props';

export interface ButtonProps extends PressableProps {
  intent?: ButtonIntent;
  size?: ButtonSize;
  children?: React.ReactNode;
}

const sizeHeight: Record<ButtonSize, number> = { sm: 32, md: 44, lg: 48 };
const sizePadX: Record<ButtonSize, number> = { sm: spacing.md, md: spacing.md, lg: spacing.lg };
// Size AND line height, so the label block matches `text-sm`/`text-base` on
// the web leaf rather than react-native-web's `line-height: normal`.
const sizeText = { sm: textScale.sm, md: textScale.sm, lg: textScale.base } satisfies Record<
  ButtonSize,
  { fontSize: number; lineHeight: number }
>;

export function Button({
  intent = 'primary',
  size = 'md',
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  // Colors resolve per render so the leaf follows the OS scheme; only the
  // scheme-independent maps and layout live at module level.
  const c = useNativeColors();
  const intentBg: Record<ButtonIntent, string> = {
    primary: c.primary,
    secondary: c.surfaceAlt,
    ghost: 'transparent',
  };
  const intentText: Record<ButtonIntent, string> = {
    primary: c.primaryText,
    secondary: c.ink,
    ghost: c.ink,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled ?? undefined}
      style={(state) => [
        styles.base,
        {
          height: sizeHeight[size],
          paddingHorizontal: sizePadX[size],
          backgroundColor: intentBg[intent],
          opacity: disabled ? 0.5 : state.pressed ? 0.9 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, sizeText[size], { color: intentText[intent] }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  label: {
    fontWeight: '500',
  },
});
