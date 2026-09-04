// NATIVE LEAF — React Native primitives, an INTERACTIVE slider. Shares its
// value, snapping and keyboard grammar with the web leaf (slider.props); what
// is reimplemented here is everything the browser was doing for free.
//
// React Native has no slider, and this package may not add one: a native module
// (@react-native-community/slider) would have to be declared as a dependency,
// and the dependency rule in package.json's comment block is explicit that
// nothing native may be — a web consumer would then install a renderer it never
// loads. So the drag is hand-rolled from `PanResponder`, which is core RN.
//
// THE GESTURE, and why it is shaped this way:
//
//  - The responder is created ONCE (a lazy ref) and never re-created. The
//    handlers it closes over would otherwise capture a stale value on every
//    render, mid-drag, which is the classic way a hand-rolled RN slider ends up
//    snapping back to where the gesture started. The live values reach it
//    through refs that an effect keeps current.
//  - The position is `locationX` at grant plus `gestureState.dx` thereafter,
//    NOT `locationX` per move: `locationX` is relative to whichever view
//    received the touch, and once a finger is over the thumb that is a
//    different view from the track. `dx` is relative to the gesture's own
//    origin on both platforms.
//  - Track width comes from `onLayout`, so the first frame has no width and
//    seeking is refused until it does — a divide by zero would otherwise put
//    the thumb at `NaN%`.
//
// A11Y: `accessibilityRole="adjustable"` is RN's slider role (react-native-web
// maps it to `role="slider"` for the DOM), and the increment/decrement actions
// are what a screen-reader user swipes to move it — they run the SAME step
// arithmetic the web leaf's arrow keys do. The value is reported BOTH ways for
// the reason meter.native.tsx records: react-native-web ignores the nested
// `accessibilityValue` object, so without the `aria-*` trio the web build
// announces a slider with no position.
import * as React from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type PanResponderInstance,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { radii } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { useSliderState, valueAtPercent, type SliderOwnProps } from './slider.props';

export interface SliderProps extends Omit<ViewProps, 'children' | 'style'>, SliderOwnProps {
  /** Plain style only (no function-of-press-state form) — see Checkbox/Field. */
  style?: StyleProp<ViewStyle>;
}

export const Slider = ({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  buffered,
  label,
  disabled = false,
  style,
  ...props
}: SliderProps) => {
  const c = useNativeColors();
  const state = useSliderState({
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    buffered,
    min,
    max,
    step,
    disabled,
  });

  const [width, setWidth] = React.useState(0);

  // The responder's window onto the current render. Written in an effect, not
  // during render, so a re-entrant render never sees a half-updated view.
  const live = React.useRef({ width, disabled, seek: (_x: number) => {}, commit: () => {} });
  React.useEffect(() => {
    live.current = {
      width,
      disabled,
      seek: (x: number) => {
        if (disabled || width <= 0) return;
        state.setValue(valueAtPercent((x / width) * 100, min, max, step));
      },
      commit: state.commit,
    };
  });

  const originX = React.useRef(0);
  const responder = React.useRef<PanResponderInstance | null>(null);
  if (responder.current === null) {
    responder.current = PanResponder.create({
      // Refused while disabled so the gesture falls through to whatever
      // scroller is underneath, rather than being swallowed by a control that
      // will not act on it.
      onStartShouldSetPanResponder: () => !live.current.disabled,
      onMoveShouldSetPanResponder: () => !live.current.disabled,
      onPanResponderGrant: (event) => {
        originX.current = event.nativeEvent.locationX;
        live.current.seek(originX.current);
      },
      onPanResponderMove: (_event, gesture) => {
        live.current.seek(originX.current + gesture.dx);
      },
      onPanResponderRelease: () => live.current.commit(),
      // A terminate is a gesture taken away by a parent scroller: the finger
      // is gone as far as this control is concerned, so it commits what it has
      // rather than leaving the caller waiting for a release that never comes.
      onPanResponderTerminate: () => live.current.commit(),
    });
  }

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityValue={{ min, max, now: state.value }}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={state.value}
      aria-disabled={disabled}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (disabled) return;
        if (event.nativeEvent.actionName === 'increment') state.nudge(1);
        else if (event.nativeEvent.actionName === 'decrement') state.nudge(-1);
        else return;
        // An assistive-technology swipe is a complete interaction on its own —
        // there is no release to wait for, so it commits immediately.
        state.commit();
      }}
      onLayout={onLayout}
      style={[styles.root, disabled ? styles.disabled : null, style]}
      {...responder.current.panHandlers}
      {...props}
    >
      <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}>
        {/* Buffered first: it is BEHIND the primary fill, and in RN that is
            simply the earlier sibling. */}
        {state.bufferedPercent === null ? null : (
          <View
            style={[styles.fill, { backgroundColor: c.line, width: `${state.bufferedPercent}%` }]}
          />
        )}
        <View style={[styles.fill, { backgroundColor: c.primary, width: `${state.percent}%` }]} />
      </View>
      <View
        style={[styles.thumb, { backgroundColor: c.primary, left: `${state.percent}%` }]}
        pointerEvents="none"
      />
    </View>
  );
};

// Layout only — every colour is resolved at render time from useNativeColors(),
// because a StyleSheet.create block runs once at module load and can never
// follow the OS scheme. See lib/native-theme.native.ts.
const styles = StyleSheet.create({
  // 24 high for a touchable band around an 8px track: the track is what you
  // see, the root is what you can hit.
  root: { width: '100%', height: 24, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  track: { height: 8, width: '100%', borderRadius: radii.pill, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radii.pill },
  // `left` is the percentage; the negative margin pulls the 16px thumb back by
  // its own half so its CENTRE sits on the value rather than its left edge.
  thumb: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: radii.pill,
  },
});
