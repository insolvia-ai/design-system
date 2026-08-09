// NATIVE LEAF (icon) — the same calendar and clock, drawn from bordered Views.
//
// See `ICON` in date-input.props.ts for why these are boxes rather than an SVG
// or a text glyph. React Native has no `currentColor`, so the colour is passed
// in; the web leaf inherits it instead, which is the only difference between
// the two drawings.
//
// Percentages and `calc` are not available for the hands here the way they are
// in CSS, so the offsets are arithmetic over the SAME shared constants — and RN
// positions an absolute child inside the border, exactly as CSS does, so the
// two land in the same place.
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { ICON, iconFor, type DateInputMode } from './date-input.props';

/** The box inside the border — what an absolutely positioned child sits in. */
const INNER = ICON.size - ICON.stroke * 2;
const CENTRE = INNER / 2;

export function PickerIcon({ mode, color }: { mode: DateInputMode; color: string }) {
  if (iconFor(mode) === 'clock') {
    return (
      <View style={[styles.box, styles.clock, { borderColor: color }]}>
        {/* The long hand, pointing up from the centre. */}
        <View
          style={{
            position: 'absolute',
            left: CENTRE - ICON.handThickness / 2,
            top: CENTRE - ICON.handUp,
            width: ICON.handThickness,
            height: ICON.handUp,
            backgroundColor: color,
          }}
        />
        {/* The short one, pointing right. */}
        <View
          style={{
            position: 'absolute',
            left: CENTRE,
            top: CENTRE - ICON.handThickness / 2,
            width: ICON.handRight,
            height: ICON.handThickness,
            backgroundColor: color,
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.box, styles.calendar, { borderColor: color }]}>
      {/* The binding across the top — what makes a bordered square a calendar. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: ICON.headerHeight,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// Layout only — every colour arrives at render time, per the package rule.
const styles = StyleSheet.create({
  box: {
    width: ICON.size,
    height: ICON.size,
    borderWidth: ICON.stroke,
  },
  calendar: { borderRadius: ICON.radius },
  clock: { borderRadius: ICON.size / 2 },
});
