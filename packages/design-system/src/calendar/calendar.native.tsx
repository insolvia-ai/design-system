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

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
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
  const body = useNativeBodyFamily();
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

  // THREE RINGS. Each pager is its own tab stop, so each owns its own hook
  // instance — one instance holds a single boolean and would light both.
  const prevFocus = useNativeFocusRing();
  const nextFocus = useNativeFocusRing();
  // The grid takes ONE instance for all 42 cells — the ring's GEOMETRY and
  // COLOUR are the same wherever it lands, and only one cell can hold focus at
  // a time. `ringOn` is the second half: WHICH cell. It tracks real DOM focus
  // rather than `focused`, which is the roving tabindex and can point at a day
  // that never took focus (see the effect below), and a ring that is not on
  // the focused control is worse than no ring at all.
  const dayFocus = useNativeFocusRing();
  const [ringOn, setRingOn] = React.useState<string | null>(null);

  // Follow the roving tabindex with REAL focus, as the web leaf does. Without
  // this the arrows moved `focused` — the tabindex, and what the next Tab
  // leaves from — while DOM focus stayed on the day the user arrived at, so a
  // screen reader went on announcing that first day for every press after it.
  // Measured in a browser: ArrowRight off 19 March left `document.activeElement`
  // on 19 and put `tabindex="0"` on 20.
  //
  // Gated on the grid ALREADY holding focus, or a `value` arriving from outside
  // would steal focus from wherever the page had it — the web leaf's `insideRef`
  // guard, spelled here with the ring's own boolean because it is the same
  // question.
  const dayRef = React.useRef<View | null>(null);
  React.useEffect(() => {
    if (!dayFocus.focused) return;
    // react-native-web hands back the DOM node, which has `focus()`. A real
    // device hands back a host component that has none — and has nothing to
    // rove, no keyboard to rove it with — so the optional call is the whole
    // platform branch.
    //
    // A day OUT OF RANGE is where the two leaves genuinely part. The web leaf
    // marks it `aria-disabled` and it stays focusable; react-native-web reads
    // `aria-disabled` off `disabled` and back again (Pressable overwrites the
    // prop with its own, and `createDOMProps` turns it into a real
    // `<button disabled>`), so there is no way to say "unavailable but
    // reachable" here. Focus therefore stays where it is rather than being
    // thrown at an element that cannot hold it and landing on `<body>`; the
    // ring stays with it, because `ringOn` follows focus and not the tabindex.
    const node = dayRef.current as { focus?: () => void; disabled?: boolean } | null;
    if (node?.disabled === true) return;
    node?.focus?.();
  }, [focused, dayFocus.focused]);

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
          onFocus={prevFocus.focus}
          onBlur={prevFocus.blur}
          style={[styles.pager, prevFocus.ringStyle]}
        >
          {/* Both pager glyphs sit in a fixed box, not body copy — they keep the platform face. */}
          <Text style={[styles.pagerGlyph, { color: c.muted }]}>&#8249;</Text>
        </Pressable>
        {/* `aria-live="polite"` matches the web leaf: paging must announce the
            month, or a screen-reader user hears nothing when they press. */}
        <Text
          nativeID={labelId}
          {...({ 'aria-live': 'polite' } as object)}
          style={[styles.monthLabel, { fontFamily: body }, { color: c.ink }]}
        >
          {monthLabel(viewMonth)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setViewMonth(shiftMonths(viewMonth, 1))}
          onFocus={nextFocus.focus}
          onBlur={nextFocus.blur}
          style={[styles.pager, nextFocus.ringStyle]}
        >
          <Text style={[styles.pagerGlyph, { color: c.muted }]}>&#8250;</Text>
        </Pressable>
      </View>

      <View nativeID={gridId} {...webRole('grid')} {...webOnly}>
        <View {...webRole('row')} style={styles.week}>
          {WEEKDAYS.map((weekday) => (
            <View key={weekday} {...webRole('columnheader')} style={styles.cell}>
              <Text style={[styles.weekday, { fontFamily: body }, { color: c.muted }]}>
                {weekday}
              </Text>
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
                    // Only ever the ONE tabbable day, so the effect above has
                    // a single node to move focus to.
                    ref={isFocused ? dayRef : null}
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
                    onFocus={() => {
                      setRingOn(day.iso);
                      dayFocus.focus();
                    }}
                    onBlur={() => {
                      setRingOn((current) => (current === day.iso ? null : current));
                      dayFocus.blur();
                    }}
                    style={[
                      styles.day,
                      { borderRadius: r.md },
                      selected ? { backgroundColor: c.primary } : null,
                      disabled ? styles.disabled : null,
                      // The shared instance says WHETHER the grid holds focus
                      // and in what colour; `ringOn` says WHICH cell wears it.
                      ringOn === day.iso ? dayFocus.ringStyle : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        { fontFamily: body },
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
