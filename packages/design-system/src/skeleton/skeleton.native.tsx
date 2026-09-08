// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. A single
// filled `Animated.View` for `circle`/`rect` and for a one-line `text`;
// `lines` greater than 1 stacks that many inside a plain `View` column
// instead — see skeleton.props.ts for the sizing and paragraph-width math
// this leaf only applies. Colors resolve at render time via
// useNativeColors(); StyleSheet.create holds scheme- and theme-independent
// layout only.
//
// DECORATIVE, BOTH FORMS. `accessible={false}` is the correct React Native
// prop for pulling a subtree out of the accessibility tree, and
// `importantForAccessibility="no-hide-descendants"` is the Android-specific
// reinforcement of the same thing — but neither ever reaches the DOM through
// react-native-web (its `forwardedProps` module forwards `aria-hidden`;
// `accessible` and `importantForAccessibility` are not on that list at all).
// So `aria-hidden` rides alongside them, for the same reason
// meter.native.tsx carries `accessibilityValue` AND the `aria-value*` trio:
// without it, this leaf is silent on a real device and fully announced on
// the web build of the very same code.
import * as React from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type EmitterSubscription,
  type ViewProps,
} from 'react-native';

import { motion, radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import {
  resolveHeight,
  resolveLineCount,
  resolveWidth,
  textLineWidth,
  type SkeletonDimension,
  type SkeletonOwnProps,
} from './skeleton.props';

export interface SkeletonProps
  extends
    Omit<ViewProps, 'accessible' | 'importantForAccessibility' | 'aria-hidden' | 'children'>,
    SkeletonOwnProps {}

/**
 * Narrows the shared `SkeletonDimension` (`number | string`) to what React
 * Native's own style types accept (`number | 'auto' | \`${number}%\` | ...`,
 * a closed union tsc cannot verify a plain `string` against statically).
 * `skeleton.props.ts` already documents the runtime contract this leaf's own
 * `width`/`height` props keep — a number or a percentage — so this is a
 * type-level acknowledgement of that contract, not a new runtime check.
 */
function toDimension(value: SkeletonDimension): DimensionValue {
  return value as DimensionValue;
}

// One leg of the 1 → 0.5 → 1 loop. `motion.durationBase` (200ms) is the
// package's one "things that move, open, or fade" duration; there is no
// motion token sized for a multi-second loop like this one, so this scales
// that up rather than inventing an unrelated number. Two legs make a ~1.6s
// cycle, close to Tailwind's own `animate-pulse` that the web leaf rides on
// (2s).
const PULSE_LEG_MS = motion.durationBase * 4;

// The package's one standard curve, as control points — `motion.
// easingStandard` carries the same curve as a CSS `cubic-bezier()` string,
// which `Easing.bezier` cannot parse; restating the four numbers is cheaper
// than a parser for a curve that has not moved since the token was
// authored.
const PULSE_EASING = Easing.bezier(0.2, 0, 0, 1);

/**
 * Whether the OS "reduce motion" setting is on, live. Starts `false` (an
 * animation that never ran a single frame before the promise below settles
 * is not the failure mode worth guarding — an animation still running once
 * the OS says to stop is) and flips once `isReduceMotionEnabled()` resolves,
 * then tracks `reduceMotionChanged` for as long as this is mounted.
 */
function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription: EmitterSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduceMotion(enabled),
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * The pulse's current opacity — one `Animated.Value`, looping between `1`
 * and `0.5` while `active` and pinned to the static `1` otherwise. The loop
 * is started in an effect and explicitly `.stop()`-ped on unmount or
 * deactivation; an `Animated.loop` left running past unmount keeps ticking
 * against a detached value forever, which is a leak react-native does not
 * clean up on its own.
 */
function usePulseOpacity(active: boolean): Animated.Value {
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!active) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: PULSE_LEG_MS,
          easing: PULSE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_LEG_MS,
          easing: PULSE_EASING,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, opacity]);

  return opacity;
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  lines,
  animation = 'pulse',
  style,
  ...props
}: SkeletonProps) => {
  const c = useNativeColors();
  const r = useNativeRadii();
  const reduceMotion = useReduceMotion();
  const opacity = usePulseOpacity(animation === 'pulse' && !reduceMotion);

  const w = resolveWidth(variant, width);
  const h = resolveHeight(variant, width, height);
  const count = resolveLineCount(variant, lines);
  // `pill` is pinned rather than themeable (see native-theme.native.ts), so
  // it's read from the tokens package directly, matching Badge and Avatar.
  const cornerRadius = variant === 'circle' ? radii.pill : variant === 'rect' ? r.md : r.sm;

  if (count > 1) {
    return (
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        aria-hidden={true}
        style={[styles.column, style]}
        {...props}
      >
        {Array.from({ length: count }, (_, index) => (
          <Animated.View
            key={index}
            style={{
              width: toDimension(textLineWidth(w, index, count)),
              height: toDimension(h),
              borderRadius: cornerRadius,
              backgroundColor: c.surfaceAlt,
              opacity,
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden={true}
      style={[
        // Sizing seam: `text`/`rect` declare nothing and stretch to the
        // parent's width, matching the web leaf's block-level root; `circle`
        // hugs its own box, the one variant that does not stretch.
        variant === 'circle' ? styles.circle : null,
        {
          width: toDimension(w),
          height: toDimension(h),
          borderRadius: cornerRadius,
          backgroundColor: c.surfaceAlt,
          opacity,
        },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  column: { gap: spacing.xs },
  circle: { alignSelf: 'flex-start' },
});
