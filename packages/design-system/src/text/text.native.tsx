// NATIVE LEAF — React Native's Text over @insolvia-ai/tokens.
//
// RN has one text primitive and no element names, so `as` has no counterpart
// here: what the web leaf expresses by choosing `<h3>` vs `<p>`, this leaf
// expresses with `accessibilityRole="header"` — which is exactly the split
// `isHeadingVariant` exists to keep in one place.
//
// Colors resolve at render time from useNativeColors(); StyleSheet.create
// holds only the scheme-independent size and family blocks.
import * as React from 'react';
import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useNativeColors } from '../lib/native-theme';
import { headingFamily, textScale } from '../lib/native-typography';
import {
  isHeadingVariant,
  variantWeight,
  type TextTone,
  type TextVariant,
  type TextWeight,
} from './text.props';

export interface TextProps extends RNTextProps {
  variant?: TextVariant | undefined;
  tone?: TextTone | undefined;
  weight?: TextWeight | undefined;
  children?: React.ReactNode;
}

const weightValue: Record<TextWeight, '400' | '500' | '600'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
};

export const Text = ({
  variant = 'body',
  tone = 'ink',
  weight,
  style,
  children,
  ...props
}: TextProps) => {
  const c = useNativeColors();
  // Three tones, for the contrast reason text.props.ts measures out.
  const toneColor: Record<TextTone, string> = {
    ink: c.ink,
    muted: c.muted,
    primary: c.primary,
  };

  return (
    <RNText
      // Only when it IS a heading — passing `undefined` would still be a prop
      // react-native-web has to reason about, and the roles differ per variant
      // rather than per component here.
      {...(isHeadingVariant(variant) ? ({ accessibilityRole: 'header' } as const) : {})}
      style={[
        styles[variant],
        { color: toneColor[tone], fontWeight: weightValue[weight ?? variantWeight[variant]] },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// `display` and `heading` sit above the shared `textScale`, which stops at
// `lg` because no leaf needed bigger until this component existed. Their
// line heights follow the same ~1.4 ratio the scale uses rather than
// react-native-web's `line-height: normal` (~1.2), which is what made every
// native text block run shorter than its web twin — see native-typography.
const styles = StyleSheet.create({
  display: { fontFamily: headingFamily, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: headingFamily, fontSize: 24, lineHeight: 32 },
  title: { fontFamily: headingFamily, ...textScale.lg },
  body: { ...textScale.sm },
  caption: { ...textScale.xs },
});
