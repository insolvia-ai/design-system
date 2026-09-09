// NATIVE LEAF — React Native primitives. There is no CSS clip-rect trick on
// native, but the same idea has a direct RN equivalent: a `Text` pinned to a
// 1x1 box with `overflow: 'hidden'` and `opacity: 0`. VoiceOver and TalkBack
// both still announce it — an absolutely positioned, invisible element stays
// in the accessibility tree; only `accessibilityElementsHidden` (iOS) /
// `importantForAccessibility="no-hide-descendants"` (Android) would pull it
// OUT of that tree, which is exactly the opposite of what this component is
// for, so neither is used here.
import * as React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useNativeBodyFamily } from '../lib/native-typography';
import type { VisuallyHiddenOwnProps } from './visually-hidden.props';

export interface VisuallyHiddenProps extends Omit<TextProps, 'children'>, VisuallyHiddenOwnProps {}

export function VisuallyHidden({
  style,
  focusable: _focusable,
  children,
  ...props
}: VisuallyHiddenProps) {
  // Nothing is seen here, but the text is still body copy — a consumer's
  // `fonts.body` reaches it like every other Text, so nothing about this leaf
  // has to be special-cased if it is ever revealed.
  const body = useNativeBodyFamily();
  // `focusable` is accepted for API symmetry with the web leaf and ignored:
  // native has no focus-driven visibility to opt into (nothing here is
  // keyboard-focusable the way a web skip link is), so there is no native
  // reading of "reveal on focus" to implement.
  return (
    <Text style={[styles.hidden, { fontFamily: body }, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});
