// NATIVE LEAF — RN primitives over the same shared month grid and keyboard
// grammar (calendar.props).
//
// No `<table>` to lean on, so the grid semantics are asserted by hand:
// `role="grid"`, `row`, `columnheader`, `gridcell`. RN's `Role` union carries
// none of them and react-native-web forwards the strings to the DOM — the same
// omission select.native.tsx documents for `listbox`.
//
// The roving tabindex has no counterpart on a touch device (nothing to rove),
// but `onKeyDown` is wired anyway, because this is the leaf a React Native
// consumer renders in a browser through react-native-web — and there a
// keyboard is real.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { isOutOfRange } from '../lib/date';
import {
  calendarKeyIntent,
  dayLabel,
  monthLabel,
  shiftMonths,
  useCalendarState,
  WEEKDAYS,
  type CalendarOwnProps,
} from './calendar.props';

export interface CalendarProps extends ViewProps, CalendarOwnProps {}

/** Applies a role react-native-web forwards but RN's own types do not admit. */
function webRole(role: string): Partial<ViewProps> {
  return { role } as unknown as Partial<ViewProps>;
}

export const Calendar = ({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  defaultMonth,
  today,
  style,
  ...props
}: CalendarProps) => {
  const c = useNativeColors();
  const r = useNativeRadii();
  const state = useCalendarState({
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    defaultMonth,
    today,
  });
  const { weeks, focused, setFocused, select, viewMonth, setViewMonth, gridId, labelId } = state;

  const handleKeyDown = (event: { key: string; preventDefault?: () => void }) => {
    const intent = calendarKeyIntent(event.key, focused);
    if (intent.kind === 'none') return;
    event.preventDefault?.();
    if (intent.kind === 'focus') setFocused(intent.iso);
    else select(intent.iso);
  };

  // `onKeyDown` and `aria-labelledby` are web-only and outside RN's types;
  // react-native-web forwards both. Contained here, as every other native leaf
  // in this package does.
  const webOnly = { onKeyDown: handleKeyDown, 'aria-labelledby': labelId } as object;

  return (
    <View
      style={[
        styles.root,
        { borderRadius: r.lg },
        { borderColor: c.line, backgroundColor: c.card },
        style,
      ]}
      {...props}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => setViewMonth(shiftMonths(viewMonth, -1))}
          style={styles.pager}
        >
          <Text style={[styles.pagerGlyph, { color: c.muted }]}>&#8249;</Text>
        </Pressable>
        {/* `aria-live="polite"` matches the web leaf: paging must announce the
            month, or a screen-reader user hears nothing when they press. */}
        <Text
          nativeID={labelId}
          {...({ 'aria-live': 'polite' } as object)}
          style={[styles.monthLabel, { color: c.ink }]}
        >
          {monthLabel(viewMonth)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setViewMonth(shiftMonths(viewMonth, 1))}
          style={styles.pager}
        >
          <Text style={[styles.pagerGlyph, { color: c.muted }]}>&#8250;</Text>
        </Pressable>
      </View>

      <View nativeID={gridId} {...webRole('grid')} {...webOnly}>
        <View {...webRole('row')} style={styles.week}>
          {WEEKDAYS.map((weekday) => (
            <View key={weekday} {...webRole('columnheader')} style={styles.cell}>
              <Text style={[styles.weekday, { color: c.muted }]}>{weekday}</Text>
            </View>
          ))}
        </View>

        {weeks.map((week) => (
          <View key={week[0]?.iso} {...webRole('row')} style={styles.week}>
            {week.map((day) => {
              const selected = day.iso === state.value;
              const disabled = isOutOfRange(day.iso, min, max);
              const isFocused = day.iso === focused;
              return (
                <View
                  key={day.iso}
                  {...webRole('gridcell')}
                  {...({ 'aria-selected': selected } as object)}
                  style={styles.cell}
                >
                  <Pressable
                    accessibilityRole="button"
                    // "5 March 2026" — the same words the web leaf announces.
                    accessibilityLabel={dayLabel(day.iso)}
                    aria-disabled={disabled}
                    disabled={disabled}
                    // The roving tabindex, for the browser case. On a device
                    // there is nothing to rove and this is inert.
                    {...({
                      tabIndex: isFocused ? 0 : -1,
                      ...(day.iso === today ? { 'aria-current': 'date' } : {}),
                    } as object)}
                    onPress={() => select(day.iso)}
                    style={[
                      styles.day,
                      { borderRadius: r.md },
                      selected ? { backgroundColor: c.primary } : null,
                      disabled ? styles.disabled : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        {
                          color: selected ? c.primaryText : day.inMonth ? c.ink : c.muted,
                        },
                        selected && styles.daySelected,
                      ]}
                    >
                      {day.day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pager: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pagerGlyph: { ...textScale.base },
  monthLabel: { ...textScale.sm, fontWeight: '500' },
  week: { flexDirection: 'row' },
  // `text-xs`, matching the web leaf's column headers.
  weekday: { ...textScale.xs, fontWeight: '600' },
  // 40dp cells, matching the web leaf's `size-10`.
  cell: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  day: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { ...textScale.sm },
  daySelected: { fontWeight: '500' },
  disabled: { opacity: 0.5 },
});
