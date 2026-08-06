// NATIVE LEAF — React Native primitives, faithful progress bar. Shares the
// value/max/percent model with the web leaf (progress.props); what's
// reimplemented here is the rendered elements and the a11y surface: no <div>,
// so behavior maps onto View + accessibilityRole="progressbar" and
// accessibilityValue. accessibilityValue is OMITTED (not set to undefined)
// while indeterminate — the same "never point at something that isn't there"
// idiom field.native.tsx uses for its web-only aria props — so a screen
// reader is never told a stale "now" for a task with no known progress.
import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { radii } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import {
  ProgressRootContext,
  progressPercent,
  useProgressRootContext,
  type ProgressRootOwnProps,
} from './progress.props';

export interface ProgressRootProps extends Omit<ViewProps, 'children'>, ProgressRootOwnProps {
  children?: React.ReactNode;
}

const ProgressRoot = ({
  value = null,
  max = 100,
  children,
  style,
  ...props
}: ProgressRootProps) => {
  const indeterminate = value === null;
  const percent = progressPercent(value, max);

  // BOTH forms, for the reason spelled out in meter.native.tsx:
  // react-native-web ignores the nested `accessibilityValue` object, so the
  // `aria-*` props are what actually reach the DOM on the web build.
  //
  // Still OMITTED rather than set-to-undefined when indeterminate — that part
  // was always right. React Native merges the object it is given, and an
  // indeterminate bar reporting a value announces progress that is not
  // happening.
  const accessibilityValueProp = indeterminate
    ? {}
    : {
        accessibilityValue: { now: value, min: 0, max },
        'aria-valuenow': value,
        'aria-valuemin': 0,
        'aria-valuemax': max,
      };

  return (
    <View
      accessibilityRole="progressbar"
      {...accessibilityValueProp}
      style={[styles.root, style]}
      {...props}
    >
      <ProgressRootContext.Provider value={{ value, max, percent }}>
        {children}
      </ProgressRootContext.Provider>
    </View>
  );
};

const ProgressTrack = ({ style, ...props }: ViewProps) => {
  const c = useNativeColors();
  return <View style={[styles.track, { backgroundColor: c.surfaceAlt }, style]} {...props} />;
};

const ProgressIndicator = ({ style, ...props }: ViewProps) => {
  const { value, percent } = useProgressRootContext('Indicator');
  const c = useNativeColors();
  const indeterminate = value === null;

  return (
    <View
      style={[
        styles.indicator,
        { backgroundColor: c.primary },
        indeterminate ? styles.indeterminateWidth : { width: `${percent}%` },
        style,
      ]}
      {...props}
    />
  );
};

export const Progress = {
  Root: ProgressRoot,
  Track: ProgressTrack,
  Indicator: ProgressIndicator,
};

const styles = StyleSheet.create({
  root: { width: '100%' },
  track: { height: 8, width: '100%', overflow: 'hidden', borderRadius: radii.pill },
  indicator: { height: '100%', borderRadius: radii.pill },
  indeterminateWidth: { width: '33%' },
});
