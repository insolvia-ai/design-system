// NATIVE LEAF — RN's own ActivityIndicator, not a hand-rolled rotation.
//
// WHY THE PLATFORM CONTROL. A spinner built from Animated.loop would have to
// keep running while the app is backgrounded, respect "reduce motion" itself,
// and match each platform's idea of a busy indicator — all three of which
// ActivityIndicator already does, on iOS, Android and (through
// react-native-web) in a browser. The web leaf's ring is the only place a
// custom shape is cheap, so that is the only place one exists.
//
// The colour still resolves at render time: ActivityIndicator's `color` is a
// prop, not a StyleSheet entry, so the 0.2.1 static-colour trap does not apply
// — but it would if this were ever restyled through StyleSheet.create.
import * as React from 'react';
import { ActivityIndicator, StyleSheet, type ViewProps } from 'react-native';

import { useNativeColors } from '../lib/native-theme';
import { DEFAULT_SPINNER_LABEL, sizePx, type SpinnerSize } from './spinner.props';

export interface SpinnerProps extends ViewProps {
  size?: SpinnerSize | undefined;
  /** The accessible name. See `DEFAULT_SPINNER_LABEL`. */
  label?: string | undefined;
}

export const Spinner = ({
  size = 'md',
  label = DEFAULT_SPINNER_LABEL,
  style,
  ...props
}: SpinnerProps) => {
  const c = useNativeColors();
  return (
    <ActivityIndicator
      // Same role the web leaf sets, so both panes announce the same thing.
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      // A number rather than 'small'/'large': those two are the only named
      // sizes RN accepts and they differ per platform, which would put the two
      // leaves at different diameters for the same `size` prop.
      size={sizePx[size]}
      color={c.primary}
      style={[styles.root, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  // Shrink-wrap, as the web leaf's `inline-flex` does. `size` sets the diameter
  // on the ring INSIDE ActivityIndicator, never on the box around it, so that
  // box is `width: auto` and a React Native parent's default
  // `alignItems: 'stretch'` gives it the full width — a 16px spinner then sits
  // centred in a full-width hole, wherever the layout happens to put it, while
  // the web leaf's sits where it was placed. See chip.native.tsx for the long
  // version. Caller `style` still comes after, so a width can be imposed.
  root: { alignSelf: 'flex-start' },
});
